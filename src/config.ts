// Where the site's data lives: JSON files in public/data/ in this repo. The
// site reads and commits them through the GitHub API, and the deploy workflow
// publishes them with the site at data/<file>.
export const REPO = {
  owner: 'seanm1153-coder',
  name: 'bulking-web-app',
  branch: 'main',
  dataDir: 'public/data',
}

export const DATA_FILES = {
  links: 'links.json',
  preferences: 'preferences.json',
} as const

export type DataFile = (typeof DATA_FILES)[keyof typeof DATA_FILES]
