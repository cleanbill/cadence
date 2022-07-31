# fresh project

### Usage

Create an .env file

```
GITLAB_TOKEN=ThisReallyIsntaTOKEN
GITLAB_PROJECTS_FILE=/home/mick/cadence/projects.json
GITLAB_API_BASE_URL="https://gitlab.com/api/v4/projects/"
JIRA_USERNAME=rugby@sevens.com
JIRA_TOKEN=NotReallyAtoken
```

Start the project:

```
deno task start
```

This will watch the project directory and restart as necessary.
