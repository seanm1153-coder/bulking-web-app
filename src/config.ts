// Where saved links live. The site reads and writes this file through the
// GitHub API, and the deploy workflow publishes it with the site.
export const REPO = {
  owner: 'seanm1153-coder',
  name: 'bulking-web-app',
  branch: 'main',
  linksPath: 'public/data/links.json',
}
