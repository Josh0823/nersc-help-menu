import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu, Widget } from '@lumino/widgets';
import { IRequestResult, request } from 'requests-helper';
import { PageConfig } from '@jupyterlab/coreutils';

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

    unique += 1;

    // add entire window to a iframe-widget class div
    const div = document.createElement('div');
    div.classList.add('iframe-widget');
    const iframe = document.createElement('iframe');

    try {
      request('get', path).then((res: IRequestResult) => {
        if (res.ok && !res.headers.includes('Access-Control-Allow-Origin')) {
          iframe.src = path;
          const favicon_url = `https://www.google.com/s2/favicons?domain=${path}`;

          request('get', favicon_url).then((res2: IRequestResult) => {
            if (res2.ok) {
              const style = document.createElement('style');
              style.innerHTML = `div.${iconClass} { background: url("${favicon_url}"); }`;
              document.head.appendChild(style);
            }
          });
        } else {
          console.log(`site failed with no code: ${res.status.toString()}`);
        }
      });
    } catch (e) {
      console.log(e);

      try {
        // otherwise try to proxy
        const favicon_url = `${PageConfig.getBaseUrl()}iframes/proxy?path=${
          new URL('/favicon.ico', path).href
        }`;

        path = `iframes/proxy?path=${encodeURI(path)}`;
        iframe.src = PageConfig.getBaseUrl() + path;
        // eslint-disable-next-line no-console
        console.log(`setting proxy for ${path}`);

        request('get', favicon_url).then((res2: IRequestResult) => {
          if (res2.ok) {
            const style = document.createElement('style');
            style.innerHTML = `div.${iconClass} { background: url("${favicon_url}"); }`;
            document.head.appendChild(style);
          }
        });
      } catch (e) {
        console.log(e);
      }
    }

    div.appendChild(iframe);
    this.node.appendChild(div);
  }
}

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
          // use widget to open in new Jupyter tab
          const widget = new IFrameWidget(link.name, link.url);
          app.shell.add(widget);
          app.shell.activateById(widget.id);

          // Or use window.open to open in new browser tab
          // window.open(link.url);
        }
      });

      // add each command to the nersc help menu
      nerscHelpMenu.addItem({ command });
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
