const St = imports.gi.St;
const Gio = imports.gi.Gio;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;

const TabModeSwitchIface =
    '<node>                                                       \
     <interface name="de.devpi.tabmodesw"> \
        <method name="Enable" />                                 \
        <method name="Disable" />   \
        <method name="Pid"> \
            <arg name="pid" type="u" direction="out" /> \
        </method>                             \
        <method name="State"> \
            <arg name="state" type="b" direction="out" /> \
        </method>  \
     </interface>                                                 \
     </node>';

const TabModeSwitchDBusProxy = Gio.DBusProxy.makeProxyWrapper(TabModeSwitchIface);

class Extension {
    constructor() {

    }

    enable() {
        log(`enabling ${Me.metadata.name}`);

        this._pid = null;
        this._busProxy = new TabModeSwitchDBusProxy(Gio.DBus.session, "de.devpi.tabmodesw", "/");
        this._pid = this._busProxy.PidSync()[0];
        let state = this._busProxy.StateSync()[0];
        log(`state ${state}`);
        log(`pid ${this._pid}`);

        let menu = Main.panel.statusArea.aggregateMenu
        this.menuItem = new PopupMenu.PopupSwitchMenuItem("Tablet mode", state);
        this.menuItem.connect("toggled", Lang.bind(this, function (item, state) {
            if (state) {
                // socket enable tablet mode
                this._busProxy.EnableSync();
            } else {
                // socket disable tablet mode
                this._busProxy.DisableSync();
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
        let lockingScreen = (Main.sessionMode.currentMode == "unlock-dialog" || Main.sessionMode.currentMode == "lock-screen");

        if (this.pid && !lockingScreen) {
            Util.spawnCommandLine("kill -TERM " + this.pid);
        }
        delete this._busProxy;
    }
}


function init() {
    log(`initializing ${Me.metadata.name}`);

    return new Extension();
}
