package com.breakoutjs;

import gnu.io.CommPortIdentifier;

import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.Container;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.Insets;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.File;
import java.io.PipedOutputStream;
import java.io.PrintStream;
import java.util.Enumeration;
import java.util.prefs.Preferences;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTabbedPane;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.ScrollPaneConstants;
import javax.swing.SwingUtilities;
import javax.swing.WindowConstants;

public class BreakoutServer extends JFrame implements ActionListener {
	
	private static final long serialVersionUID = -7512833780087238386L;
	
	private static final String buildName = "Breakout Server v0.1.1.beta";
	
	private static final int WIDTH = 480;
	private static final int HEIGHT = 360;
	private static final int LOGGING_AREA_HEIGHT = 235;
	private static final String DEFAULT_ROOT = "../";
	private static final int DEFAULT_PORT = 8887;
	private static final String PORT_KEY = "portKey";
	private static final String ROOT_KEY = "rootKey";
	
	private SerialBridge bridge;
	private int netPort;
	private String webRoot;
		
	private JComboBox serialPorts;
	private JTextField portField;
	private JTextField webRootField;
	private JLabel webRootLabel;
	private JLabel portLabel;
	private JLabel serialLabel;
	private JButton connectBtn;
	private JButton rootBtn;
	private JTextArea loggingArea;
	private JCheckBox multiClientCB;
	private JFileChooser fc;
	
	private boolean isMultiClientEnabled = false;
	
	private static final int UPDATE_FREQ = 1000;
	private ActionListener listUpdater;
	private javax.swing.Timer timer;
	
	private Preferences prefs;
	
	static public String serialPort = null;
	private int serialPortCount = 0;
	
	public BreakoutServer() {
		super();
		
		addWindowListener(new WindowAdapter() {
			@Override
			public void windowClosing(WindowEvent evt) {
				dispose();
				System.exit(0);
			}
		});
		
		// prevents version info from printing
		// comment these out when debugging
		PipedOutputStream pipeOut = new PipedOutputStream();
		System.setOut(new PrintStream(pipeOut));
				
		fc = new JFileChooser();
		fc.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);	
		
		// get a references to the user preferences
		prefs = Preferences.userRoot().node(this.getClass().getName());
		netPort = prefs.getInt(PORT_KEY, DEFAULT_PORT);
		webRoot = prefs.get(ROOT_KEY, DEFAULT_ROOT);	
		
		Container contentPane = getContentPane();
		contentPane.setLayout(new BorderLayout());
		
		JTabbedPane tabbedPane = new JTabbedPane();

		JPanel settingsPane = new JPanel();
		JPanel statusPane = new JPanel(new BorderLayout());
		JPanel portSelectionPane = new JPanel(new FlowLayout(FlowLayout.LEFT));
		
		setTitle("Breakout Server");
		setSize(WIDTH, HEIGHT);
		setResizable(false);
		
		loggingArea = new JTextArea(16, 40);
		loggingArea.setEditable(false);
		loggingArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
		loggingArea.setMargin(new Insets(5, 5, 5, 5));
		loggingArea.append(buildName + "\n\n");
		
		JScrollPane listScroller = new JScrollPane(loggingArea, ScrollPaneConstants.VERTICAL_SCROLLBAR_ALWAYS,
				ScrollPaneConstants.HORIZONTAL_SCROLLBAR_AS_NEEDED);
		
		listScroller.setPreferredSize(new Dimension(WIDTH, LOGGING_AREA_HEIGHT));
		statusPane.add(listScroller, BorderLayout.CENTER);
				
		webRootField = new JTextField(webRoot);
		webRootField.setEditable(false);
		//webRootField.setColumns(5);
		webRootField.setHorizontalAlignment(JTextField.LEADING);
		webRootLabel = new JLabel("Webserver Root Directory:");
		webRootField.addActionListener(this);
		
		rootBtn = new JButton("Choose New Webserver Root");
		rootBtn.addActionListener(this);
		
		serialLabel = new JLabel("Serial");
		serialPorts = new JComboBox();
		createPortList();

		serialPorts.addActionListener(this);
		
		portField = new JTextField(Integer.toString(netPort));
		portField.setColumns(5);
		portField.addActionListener(this);
		
		portLabel = new JLabel("Port");
		
		multiClientCB = new JCheckBox("Enable Multi-Client Connections");
		multiClientCB.addActionListener(this);
		
		connectBtn = new JButton("Connect");
		connectBtn.addActionListener(this);
		connectBtn.setActionCommand("connect");
		connectBtn.setMaximumSize(new Dimension(350, 25));
		
		portSelectionPane.add(serialLabel);
		portSelectionPane.add(serialPorts);
		portSelectionPane.add(portLabel);
		portSelectionPane.add(portField);

		webRootField.setAlignmentX(Component.LEFT_ALIGNMENT);
		webRootField.setMaximumSize(new Dimension(450, 20));
		portField.setAlignmentX(Component.LEFT_ALIGNMENT);
		portField.setMaximumSize(new Dimension(100, 20));
		
		settingsPane.setLayout(new BoxLayout(settingsPane, BoxLayout.PAGE_AXIS));
		settingsPane.setBorder(BorderFactory.createEmptyBorder(15, 10, 10, 10));
		settingsPane.add(webRootLabel);
		settingsPane.add(webRootField);
		settingsPane.add(Box.createRigidArea(new Dimension(0, 5)));
		settingsPane.add(rootBtn);
		settingsPane.add(Box.createRigidArea(new Dimension(0, 30)));
		settingsPane.add(multiClientCB);
		
		statusPane.add(portSelectionPane, BorderLayout.NORTH);

		tabbedPane.addTab("status", statusPane);
		tabbedPane.addTab("settings", settingsPane);
		
		contentPane.add(tabbedPane, BorderLayout.NORTH);
		contentPane.add(connectBtn, BorderLayout.AFTER_LAST_LINE);		
		
		setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);
		setVisible(true);
		
		startPortListTimer();			
	}
	
	/**
	 * Populate the serial port drop-down list
	 */
	private void createPortList() {
		try {
			Enumeration<?> portList = CommPortIdentifier.getPortIdentifiers();
			while (portList.hasMoreElements()) {
				CommPortIdentifier portId = (CommPortIdentifier) portList.nextElement();

				if (portId.getPortType() == CommPortIdentifier.PORT_SERIAL) {
					String name = portId.getName();
					// ignore /dev/tty to prevent duplicate serial port listings (/dev/tty and /dev/cu)
					if (!name.startsWith("/dev/tty.")) {
						serialPorts.addItem(name);
					}
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	/**
	 * Update the serial port drop-down list
	 */
	private void updatePortList() {
		serialPorts.removeAllItems();
		createPortList();
	}
	
	/**
	 * Check if the serial port list has changed
	 */
	private void checkPortList() {
		serialPortCount = 0;
		
		try {
			Enumeration<?> portList = CommPortIdentifier.getPortIdentifiers();
			while (portList.hasMoreElements()) {
				CommPortIdentifier portId = (CommPortIdentifier) portList.nextElement();

				if (portId.getPortType() == CommPortIdentifier.PORT_SERIAL) {
					String name = portId.getName();
					if (!name.startsWith("/dev/tty.")) {
						serialPortCount++;
					}
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		if (serialPortCount != serialPorts.getItemCount()) {
			// an I/O board was added or removed so update the list
			updatePortList();
		}
		
	}
	
	/**
	 * Print a message to the server logging window
	 * @param msg The message to print
	 */
	public void printMessage(final String msg) {
		SwingUtilities.invokeLater(new Runnable() {
			public void run() {
				loggingArea.append(msg + "\n");
				loggingArea.setCaretPosition(loggingArea.getDocument().getLength());
			}
		});
	}

	/**
	 * Handle UI component events.
	 */
	public void actionPerformed(ActionEvent event) {
		if (event.getSource() == serialPorts) {
			if (serialPorts != null) {
				if (serialPorts.getSelectedIndex() < 0) {
					return;
				}
				
				serialPort = (String) serialPorts.getSelectedItem();
			}
		}
		else if (event.getSource() == portField) {
			int port = Integer.parseInt(portField.getText());
			// to do: set the correct range
			if (port > 1000 && port < 10000) {
				netPort = port;
				// store new netPort value in persistent preferences
				prefs.putInt(PORT_KEY, netPort);
			}
		}
		else if (event.getSource() == multiClientCB) {
			isMultiClientEnabled = multiClientCB.isSelected();
		}
		else if (event.getSource() == rootBtn) {
			System.out.println("root btn clicked");
			int returnVal = fc.showOpenDialog(BreakoutServer.this);
			
			if (returnVal == JFileChooser.APPROVE_OPTION) {
				File file = fc.getSelectedFile();
				
				try {
					webRoot = file.getAbsolutePath();
					// store new webRoot value in persistent preferences
					prefs.put(ROOT_KEY, webRoot);
					//System.out.println("selected " + webRoot);
				}  catch (SecurityException e) {
					e.printStackTrace();
				}
				
				webRootField.setText(webRoot);
			} else {
				// user canceled file chooser dialog
			}
		}
		else if ("connect".equals(event.getActionCommand())) {			
			// for now, if no serial port is selected upon connect
			// get first item in list
			// to do: store selection in a file and use the store serial port as default
			if (serialPort == null) {
				serialPort = (String) serialPorts.getItemAt(0);
			}
				
			bridge = new SerialBridge(netPort, this, webRoot, isMultiClientEnabled);
			
			bridge.begin(serialPort, 57600);
						
			connectBtn.setText("Disconnect");
			connectBtn.setActionCommand("disconnect");
			
			if (timer != null) {
				stopPortListTimer();
			}
		}
		else if ("disconnect".equals(event.getActionCommand())) {
			// to do: stop the websocket server?
			bridge.stop();
			printMessage("Disconnected\n\r");
			
			// dispose of the serial port
			bridge.dispose();
			bridge = null;
			
			connectBtn.setText("Connect");
			connectBtn.setActionCommand("connect");
			
			startPortListTimer();
		}
	}
	
	/**
	 * When the server is not connected, update the serial port list
	 * at the rate specified by UPDATE_FREQ.
	 */
	private void startPortListTimer() {
		listUpdater = new ActionListener() {
			public void actionPerformed(ActionEvent evt) {
				checkPortList();
			}
		};
		timer = new javax.swing.Timer(UPDATE_FREQ, listUpdater);
		timer.start();
	}
	
	/**
	 * Stop updating the serial port list while the server
	 * is connected.
	 */
	private void stopPortListTimer() {
		timer.stop();
		timer.removeActionListener(listUpdater);
		listUpdater = null;
		timer = null;
	}
		
	/**
	 * The name of the selected serial port
	 * @return
	 */
	public String getSerialPort() {
		return serialPort;
	}
	
	/**
	 * The network port number
	 * @return
	 */
	public int getNetPort() {
		return netPort;
	}
			
	/**
	 * @param args
	 */
	public static void main(String[] args) {
		
		new BreakoutServer();
		
	}

}
