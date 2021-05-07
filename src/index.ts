import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';

import { WidgetTracker } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu, Widget } from '@lumino/widgets';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

// partially from https://github.com/timkpaine/jupyterlab_iframe/blob/main/js/src/index.ts
let unique = 0;
class IFrameWidget extends Widget {
  public constructor(title: string, path: string) {
    super();
    this.id = `${path}-${unique}`;
    const iconClass = `favicon-${unique}`;

    // set up variables about the widget window
    this.title.iconClass = iconClass;
    this.title.label = title;
    this.title.closable = true;
  }

  public async createIFrame(title: string, path: string): Promise<boolean> {
    unique += 1;

    // add entire window to a iframe-widget class div
    const div = document.createElement('div');
    div.classList.add('iframe-widget');
    const iframe = document.createElement('iframe');

    try {
      await fetch(path).then((res: Response) => {
        if (res.ok && !res.headers.has('Access-Control-Allow-Origin')) {
          iframe.src = path;
        } else {
          // this means the fetch succeed but didn't return correct info
          console.error('site failed with no code');
          return false;
        }
      });
    } catch (e) {
      // this means the fetch failed
      console.log(e);
      return false;
    }

    div.appendChild(iframe);
    this.node.appendChild(div);
    return true;
  }
}

/**
 * Initialization data for the nersc-help-menu extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'nersc-help-menu:plugin',
  autoStart: true,
  requires: [IMainMenu, ISettingRegistry, ILayoutRestorer],
  activate: async (
    app: JupyterFrontEnd,
    mainMenu: IMainMenu,
    settingRegistry: ISettingRegistry | null,
    restorer: ILayoutRestorer
  ) => {
    console.log('JupyterLab extension nersc-help-menu is activated!');
    const { commands } = app;

    let links = [];

    if (settingRegistry) {
      const settings = await settingRegistry.load('nersc-help-menu:plugin');
      links = settings.get('links').composite as any;
    }

    if (links === [] || Object.keys(links).length === 0) {
      console.error('NERSC Help Menu: No links are set in overrides.json');
      return;
    }

    const nerscHelpMenu: Menu = new Menu({ commands });
    nerscHelpMenu.title.label = 'NERSC Help';
    // let restoreCommand: string;
    // let widget: MainAreaWidget<IFrameWidget>;

    // Loop through links and add each as a window.open() command
    links.forEach((link: { name: string; url: string }) => {
      const command = `open-${link.name}`;
      commands.addCommand(command, {
        label: `${link.name}`,
        caption: `${link.name}`,
        execute: async () => {
          // use widget to open in new Jupyter tab
          const widget = new IFrameWidget(link.name, link.url);
          const response = await widget.createIFrame(link.name, link.url);

          // check if the IFrame was created correctly
          // if so open it in a jupyter notebook tab
          // otherwise open it in a browser tab
          if (response) {
            app.shell.add(widget, 'main');
            app.shell.activateById(widget.id);

            // find the links tracker and add the new widget to be tracked
            trackers.forEach(t => {
              if (response && t.name === link.name) {
                if (!t.tracker.has(widget)) {
                  t.tracker.add(widget);
                }
              }
            });
          } else {
            window.open(link.url);
          }
        }
      });

      // add each command to the nersc help menu
      nerscHelpMenu.addItem({ command });
    });

    // Create a tracker for every link
    const trackers: any[] = [];
    links.forEach((link: { name: string }) => {
      trackers.push({
        tracker: new WidgetTracker<IFrameWidget>({ namespace: link.name }),
        name: `${link.name}`
      });
    });

    // Try to restore any trackers
    trackers.forEach(t => {
      restorer.restore(t.tracker, {
        command: `open-${t.name}`,
        name: () => t.name
      });
    });

    // add NERSC help menu to main menu
    // mainMenu.addMenu(nerscHelpMenu, { rank: 2000 });

    // add NERSC help menu as a submenu of the help menu
    mainMenu.helpMenu.addGroup(
      [
        {
          type: 'submenu' as Menu.ItemType,
          submenu: nerscHelpMenu
        }
      ],
      1
    );
  }
};

export default extension;
