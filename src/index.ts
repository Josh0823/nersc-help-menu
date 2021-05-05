import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the nersc-help-menu extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'nersc-help-menu:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension nersc-help-menu is activated!');
  }
};

export default extension;
