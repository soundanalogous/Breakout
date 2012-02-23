package com.breakoutjs;

import gnu.io.CommPortIdentifier;
import gnu.io.SerialPort;
import gnu.io.SerialPortEvent;
import gnu.io.SerialPortEventListener;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Set;
import java.util.TooManyListenersException;

import org.webbitserver.WebServer;
import org.webbitserver.WebServers;
import org.webbitserver.WebSocketConnection;
import org.webbitserver.WebSocketHandler;
import org.webbitserver.handler.StaticFileHandler;

public class SerialBridge implements WebSocketHandler, SerialPortEventListener {
	
	private BreakoutServer parent;
	private WebServer webServer;
	private WebSocketConnection singleConnection = null;
		
	protected SerialPort port;
	protected int netPort;
	protected InputStream input;
	protected OutputStream output;
	protected final int rate = 57600;
	protected final int parity = SerialPort.PARITY_NONE;
	protected final int databits = 8;
	protected final int stopbits = SerialPort.STOPBITS_1;
	private final String MULTI_CLIENT = "multiClient";
	
	private Set<WebSocketConnection> connections;
	private boolean isConnected = false;
	private boolean isMultiClientEnabled = false;
	private int count = 1;
	private int numConnections = 0;
	
	/**
	 * 
	 * @param port The network port number to connect on
	 * @param parent A reference to the BreakoutServer instance
	 * @param webRoot A relative path to the webserver root (default = "../")
	 * @param isEnabled True if multi-client mode is enabled
	 */
	public SerialBridge(int port, BreakoutServer parent, String webRoot, boolean isMultiClientEnabled) {
		
		connections = new HashSet<WebSocketConnection>();

		// this isn't too smart, but it works for now... need to refactor
		this.parent = parent;		
		this.netPort = port;
		this.isMultiClientEnabled = isMultiClientEnabled;
		
		if (isMultiClientEnabled) {
			parent.printMessage("Multi-client mode enabled");
		}
		
		webServer = WebServers.createWebServer(port)
			.add("/websocket", this)
			.add(new StaticFileHandler(webRoot));

		this.start();
		
	}
	
	/**
	 * Start the web server
	 */
	public void start() {
		try {
			webServer.start();
			parent.printMessage("Server running on: " + webServer.getUri());
		} catch (IOException e) {
			e.printStackTrace();
		}		
	}
	
	/**
	 * Stop the web server
	 */
	public void stop() {
		try {
			webServer.stop();
		} catch (IOException e) {
			e.printStackTrace();
		}
		
	}
	
	public void begin(String serialPortName, int baudRate) {
		try {
			Enumeration<?> portList = CommPortIdentifier.getPortIdentifiers();
			
			while (portList.hasMoreElements()) {
				CommPortIdentifier portId = (CommPortIdentifier) portList.nextElement();
				
				if (portId.getPortType() == CommPortIdentifier.PORT_SERIAL) {
					
					if (portId.getName().equals(serialPortName)) {
						port = (SerialPort) portId.open("breakout server", 2000);					
						input = port.getInputStream();
						output = port.getOutputStream();
						port.setSerialPortParams(baudRate, databits, stopbits, parity);
						port.notifyOnDataAvailable(true);
						parent.printMessage("Connected to IOBoard on: " + serialPortName);
					}
				}
			}
			if (port == null) {
				System.out.println("PortNotFoundError");
				parent.printMessage("Error: Serial Port not found.");
			}
		} catch (Exception e) {
			System.out.println("InsideSerialError");
			e.printStackTrace();
			port = null;
			input = null;
			output = null;
		}
		
		try {
			port.addEventListener(this);
		} catch (TooManyListenersException e) {
			e.printStackTrace();
		}
	}
	
	/**
	 * Forward data from the serial input stream to the WebSocket
	 * output stream
	 * @param inputData
	 */
	private void processInput(int inputData) {

		String value = Integer.toString(inputData);
		
		// relay serial data to websocket
		if (isMultiClientEnabled) {
			broadcast(value);
		} else {
			this.singleConnection.send(value);
		}
	}
	
	synchronized public void serialEvent(SerialPortEvent serialEvent) {
		switch(serialEvent.getEventType()) {
			case SerialPortEvent.DATA_AVAILABLE:
				dataAvailable(serialEvent);
				break;
			default:
				//System.out.println("other serial event: " + serialEvent);
				break;
		}

	}
	
	private void dataAvailable(SerialPortEvent serialEvent) {
		try {
			while (input.available() > 0) {
				int inputData = input.read();
				
				// only send serial data when at least one client is connected
				if (isConnected) {
					processInput(inputData);
				}
			}
		} catch (IOException e) {
			
		}		
	}
	
	public void dispose() {
		try {
			if (input != null) {
				input.close();
			}
			if (output != null) {
				output.close();
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		input = null;
		output = null;
		
		// why is a thread necessary here?
		new Thread() {
			@Override
			public void run() {
				port.removeEventListener();
				port.close();
				port = null;
			}
		}.start();
	}
	
	/**
	 * Write a byte to the serial output stream.
	 * @param data
	 */
	public void writeByte(int data) {
		
		if (output == null) {
			return;
		}
		
		try {
			output.write((byte) data);
			output.flush();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	/**
	 * Send data from the IOBoard to all connected clients
	 * @param data
	 */
	private void broadcast(String data) {
		for (WebSocketConnection connection: connections) {
			connection.send(data);
		}
	}

	@Override
	public void onClose(WebSocketConnection connection) {
		parent.printMessage("Client " + connection.data("id") + " closed");
		//parent.printMessage("Client closed");
		numConnections--;
		
		if (isMultiClientEnabled) {
			connections.remove(connection);
			if (connections.isEmpty()) {
				isConnected = false;
				numConnections = 0;
				count = 1;
			}
			parent.printMessage("Number of active connections = " + numConnections);
		} else {
			this.singleConnection = null;
			isConnected = false;
			count = 1;
		}
	}

	@Override
	public void onMessage(WebSocketConnection connection, String message) {

		if (message.indexOf(',') > -1) {
			String data[] = message.split(",");
			for (int i=0; i<data.length; i++) {
				writeByte(Integer.parseInt(data[i]));
			}
		} else {
			writeByte(Integer.parseInt(message));
		}

	}
	
	public void onMessage(WebSocketConnection connection, byte[] message) {
		
	}

	@Override
	public void onOpen(WebSocketConnection connection) {
		connection.data("id", count++);
		parent.printMessage("Client " + connection.data("id") + " connected");
		//parent.printMessage("Client connected");

		numConnections++;
		
		// if multi-client connection is enabled, report status to client
		if (isMultiClientEnabled) {
			connection.send("config: " + MULTI_CLIENT);
			connections.add(connection);
			parent.printMessage("Number of active connections = " + numConnections);
		} else {
			this.singleConnection = connection;
		}
		
		isConnected = true;
	}

	@Override
	public void onPong(WebSocketConnection connection, String message) {
		
	}
	
	/**
	 * The network port number.
	 * @return
	 */
	public int getPort() {
		return netPort;
	}

}
