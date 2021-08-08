const St = imports.gi.St;
const Gio = imports.gi.Gio;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;



class Extension {
    constructor() {
        
    }
    
    enable() {
        log(`enabling ${Me.metadata.name}`);

        // start socket
        let [success, pid] = GLib.spawn_async(null, ["tabmodesw"], null, GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD, null, null);
        GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, Lang.bind(this, function(pid, status, user_data) {
            GLib.spawn_close_pid(pid);
            this.pid = null;            
        }));
        this.pid = pid;

        let menu = Main.panel.statusArea.aggregateMenu

        this.menuItem = new PopupMenu.PopupSwitchMenuItem("Tablet mode", false);
        this.menuItem.connect("toggled", Lang.bind(this, function (item, state) {
            let socketClient = new Gio.SocketClient();
            let conn = socketClient.connect(new Gio.UnixSocketAddress({path:"/tmp/tabmodesw.sock"}), null);
            let output = conn.get_output_stream();
            if (state) {
                // socket enable tablet mode
                output.write_bytes(new GLib.Bytes('1'), null);
            } else {
                // socket disable tablet mode
                output.write_bytes(new GLib.Bytes('0'), null);
            }
        }));
        menu.menu.addMenuItem(this.menuItem, 0);
    }
    
    // REMINDER: It's required for extensions to clean up after themselves when
    // they are disabled. This is required for approval during review!
    disable() {
        log(`disabling ${Me.metadata.name}`);

        this.menuItem.destroy();
        // disable socket
        if (this.pid) {
            Util.spawnCommandLine("kill -TERM " + this.pid);
        }
    }
}


function init() {
    log(`initializing ${Me.metadata.name}`);
    
    return new Extension();
}
