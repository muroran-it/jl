import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IStatusBar } from '@jupyterlab/statusbar';
import { Widget } from '@lumino/widgets';

const SESSION_API =
  'https://jl-lti.morecatlab.workers.dev/api/session';

interface MoodleSession {
  authenticated: boolean;
  user?: string;
  course?: {
    id?: string;
    title?: string;
  };
  roles?: string[];
  resourceLinkId?: string;
}

declare global {
  interface Window {
    jlMoodleSession?: MoodleSession;
  }
}

async function loadMoodleSession(
  statusWidget: Widget | null
): Promise<void> {
  try {
    console.log(
      '[jl-moodle-session] requesting Moodle session'
    );

    const response = await fetch(SESSION_API, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(
        `Session API returned HTTP ${response.status}`
      );
    }

    const session =
      (await response.json()) as MoodleSession;

    window.jlMoodleSession = session;

    console.log(
      '[jl-moodle-session] Moodle session:',
      session
    );

    if (statusWidget) {
      if (session.authenticated) {
        const course =
          session.course?.title || session.course?.id || '?';

        const user =
          session.user || '?';

        const role =
          session.roles?.join(', ') || '?';

        statusWidget.node.textContent =
          `Moodle: ${course} / User ${user} / ${role}`;

        statusWidget.node.title =
          `Moodle course: ${course}\n` +
          `User: ${user}\n` +
          `Role: ${role}`;
      } else {
        statusWidget.node.textContent =
          'Moodle: not authenticated';
      }
    }
  } catch (error) {
    console.error(
      '[jl-moodle-session] session fetch failed:',
      error
    );

    if (statusWidget) {
      statusWidget.node.textContent =
        'Moodle: session unavailable';
    }
  }
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: '@morecatlab/jl-moodle-session:plugin',

  autoStart: true,

  /*
   * IStatusBar is optional so that failure to obtain
   * the status bar never blocks JupyterLite startup.
   */
  optional: [IStatusBar],

  activate: (
    _app: JupyterFrontEnd,
    statusBar: IStatusBar | null
  ): void => {
    console.log(
      '[jl-moodle-session] extension activated'
    );

    let statusWidget: Widget | null = null;

    if (statusBar) {
      statusWidget = new Widget();

      statusWidget.node.textContent =
        'Moodle: connecting...';

      statusWidget.node.title =
        'Moodle LTI session';

      statusBar.registerStatusItem(
        '@morecatlab/jl-moodle-session:status',
        {
          item: statusWidget,
          align: 'left',
          rank: 10
        }
      );
    } else {
      console.warn(
        '[jl-moodle-session] status bar is not available'
      );
    }

    /*
     * IMPORTANT:
     * Do not await this.
     *
     * Moodle API communication must never block
     * JupyterLite startup.
     */
    void loadMoodleSession(statusWidget);
  }
};

export default plugin;
