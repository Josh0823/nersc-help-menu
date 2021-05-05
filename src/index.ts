import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@lumino/widgets';

// Temporary way to get links
// Eventually want to put this in config file
const LINKS = [
  {
    name: 'NERSC Homepage',
    url: 'https://www.nersc.gov'
  },
  {
    name: 'NERSC Jupyter Docs',
    url: 'https://docs.nersc.gov/services/jupyter'
  },
  {
    name: 'JupyterHub Docs',
    url: 'https://jupyterhub.readthedocs.io/en/stable'
  }
];

/**
 * Initialization data for the nersc-help-menu extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'nersc-help-menu:plugin',
  autoStart: true,
  optional: [IMainMenu],
  activate: (app: JupyterFrontEnd, mainMenu: IMainMenu) => {
    console.log('JupyterLab extension nersc-help-menu is activated!');
    const { commands } = app;

    const nerscHelpMenu: Menu = new Menu({ commands });
    nerscHelpMenu.title.label = 'NERSC Help';

    // Loop through links and add each as a window.open() command
    LINKS.forEach(link => {
      // console.log(link);
      const command = `open-${link.name}`;
      commands.addCommand(command, {
        label: `${link.name}`,
        caption: `${link.name}`,
        execute: () => {
          window.open(link.url);
        }
      });

      // add each command to the nersc help menu
      nerscHelpMenu.addItem({ command });
    });

    // add NERSC help menu to main menu
    mainMenu.addMenu(nerscHelpMenu, { rank: 2000 });

    // add NERSC help menu as a submenu of the help menu
    // mainMenu.helpMenu.addGroup(
    //   [
    //     {
    //       type: 'submenu' as Menu.ItemType,
    //       submenu: nerscHelpMenu
    //     }
    //   ],
    //   1
    // );
  }
};

export default extension;
