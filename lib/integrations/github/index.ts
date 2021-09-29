import { LemonContext } from '@lemon/extract/core/types/lemonContext';
import GH from 'github-api';

const { GITHUB_TOKEN } = process.env;
const client = new GH({ token: GITHUB_TOKEN });
const user = client.getUser();

/*
  Some thoughts before i forget them..
  This should be able to create task items
  should be able to monitor open reviews requested
  should be able to track current build status on PR's
  should be able to craft prs, commits, updates, etc..
*/

export const Github = (lemonContext: LemonContext) => async () => {
  // console.log(user)
  const debug = lemonContext.utils.debug.extend('gh');

  debug(`Gathering context from ${lemonContext.config.organization}/${lemonContext.config.contextRepo}`);
  const repo = await client.getRepo(lemonContext.config.organization, lemonContext.config.contextRepo);
  const { data: projects } = await repo.listProjects();

  // const { data: notifications } = await user.listNotifications();
  projects
    .filter((x) => x)
    .map((x) => {
      debug(`Found project: ${x.html_url} ${x.name} `);
      // console.log(x.repository, x.subject)
    });
};

// export default {
//     Github: () => main(),
// }
