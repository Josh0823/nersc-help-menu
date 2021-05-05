import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
  // ILayoutRestorer
} from '@jupyterlab/application';

// import { WidgetTracker } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu, Widget } from '@lumino/widgets';

// Temporary way to get links
// Eventually want to put this in config file
const LINKS = [
  {
    name: 'NERSC Jupyter Docs',
    url: 'https://docs.nersc.gov/services/jupyter'
  },
  {
    name: 'JupyterHub Docs',
    url: 'https://jupyterhub.readthedocs.io/en/stable'
  }
];

// from https://github.com/timkpaine/jupyterlab_iframe/blob/main/js/src/index.ts
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
        console.log('Headers:');
        console.log(res.headers.keys());
        if (res.ok && !res.headers.has('Access-Control-Allow-Origin')) {
          iframe.src = path;
        } else {
          // this means the fetch failed
          console.log('site failed with no code');
          return false;
        }
      });
    } catch (e) {
      // the request failed so try to proxy instead
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
  optional: [IMainMenu],
  // requires: [IMainMenu, ILayoutRestorer],
  activate: async (
    app: JupyterFrontEnd,
    mainMenu: IMainMenu
    // restorer: ILayoutRestorer
  ) => {
    console.log('JupyterLab extension nersc-help-menu is activated!');
    const { commands } = app;

    const nerscHelpMenu: Menu = new Menu({ commands });
    nerscHelpMenu.title.label = 'NERSC Help';
    // let restoreCommand: string;
    // let widget: MainAreaWidget<IFrameWidget>;

    // Loop through links and add each as a window.open() command
    LINKS.forEach(link => {
      // console.log(link);
      const command = `open-${link.name}`;
      commands.addCommand(command, {
        label: `${link.name}`,
        caption: `${link.name}`,
        execute: async () => {
          // use widget to open in new Jupyter tab
          const widget = new IFrameWidget(link.name, link.url);
          const response = await widget.createIFrame(link.name, link.url);
          console.log(`Response: ${response}`);
          // tracker.add(widget);

          // check if the IFrame was created correctly
          // if so open it in a jupyter notebook tab
          // otherwise open it in a browser tab
          if (response) {
            app.shell.add(widget, 'main');
            app.shell.activateById(widget.id);
          } else {
            window.open(link.url);
          }

          // restoreCommand = command;
          // console.log(`Restore command set to: (${restoreCommand})`);
        }
      });

      // add each command to the nersc help menu
      nerscHelpMenu.addItem({ command });
    });

    // Tried to set up restore for opened docs
    // const tracker = new WidgetTracker<IFrameWidget>({
    //   namespace: 'nersc-help-menu'
    // });
    // console.log(`Restoring with command: (${restoreCommand})`);
    // restorer.restore(tracker, {
    //   command: restoreCommand,
    //   name: () => 'nersc-help-menu'
    // });

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
