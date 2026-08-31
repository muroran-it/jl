import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IStatusBar } from '@jupyterlab/statusbar';
import { Widget } from '@lumino/widgets';

const SESSION_API =
  'https://jl-lti.morecatlab.workers.dev/api/session';

interface SessionResponse {
  authenticated: boolean;
  user?: string;
  course?: {
    id: string;
    title: string;
  };
  roles?: string[];
  resourceLinkId?: string;
  error?: string;
}

class MoodleSessionStatus extends Widget {
  constructor() {
    super();
    this.node.style.padding = '0 8px';
    this.node.style.whiteSpace = 'nowrap';
    this.node.title = 'Moodle LTI session';
    this.setText('Moodle: 確認中...');
  }

  setText(text: string): void {
    this.node.textContent = text;
  }
}

async function getMoodleSession(): Promise<SessionResponse> {
  const response = await fetch(SESSION_API, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      Accept: 'application/json'
    }
  });

  let data: SessionResponse;

  try {
    data = (await response.json()) as SessionResponse;
  } catch {
    throw new Error(
      `Session API returned non-JSON data (HTTP ${response.status})`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error || `Session API error (HTTP ${response.status})`
    );
  }

  return data;
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: '@morecatlab/jl-moodle-session:plugin',
  autoStart: true,
  optional: [IStatusBar],

  activate: async (
    app: JupyterFrontEnd,
    statusBar: IStatusBar | null
  ): Promise<void> => {
    console.log('[jl-moodle-session] extension activated');

    const status = new MoodleSessionStatus();

    if (statusBar) {
      statusBar.registerStatusItem(
        '@morecatlab/jl-moodle-session:status',
        {
          item: status,
          align: 'left',
          rank: 5
        }
      );
    }

    await app.started;

    try {
      const session = await getMoodleSession();

      console.log('[jl-moodle-session] Moodle session:', session);

      if (!session.authenticated) {
        status.setText('Moodle: 未認証');
        return;
      }

      const user = session.user || '?';
      const courseTitle =
        session.course?.title || session.course?.id || '?';
      const role =
        session.roles && session.roles.length > 0
          ? session.roles.join(', ')
          : '?';

      status.setText(
        `Moodle: ${courseTitle} / User ${user} / ${role}`
      );

      (
        window as Window & {
          jlMoodleSession?: SessionResponse;
        }
      ).jlMoodleSession = session;
    } catch (error) {
      console.error(
        '[jl-moodle-session] Failed to load Moodle session:',
        error
      );
      status.setText('Moodle: セッション取得失敗');
    }
  }
};

export default plugin;
