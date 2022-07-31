import { HandlerContext } from "$fresh/server.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";

const env = config();

// Jokes courtesy of https://punsandoneliners.com/randomness/programmer-jokes/
const JOKES = [
  "Why do Java developers often wear glasses? They can't C#.",
  "A SQL query walks into a bar, goes up to two tables and says “can I join you?”",
  "Wasn't hard to crack Forrest Gump's password. 1forrest1.",
  "I love pressing the F5 key. It's refreshing.",
  "Called IT support and a chap from Australia came to fix my network connection.  I asked “Do you come from a LAN down under?”",
  "There are 10 types of people in the world. Those who understand binary and those who don't.",
  "Why are assembly programmers often wet? They work below C level.",
  "My favourite computer based band is the Black IPs.",
  "What programme do you use to predict the music tastes of former US presidential candidates? An Al Gore Rhythm.",
  "An SEO expert walked into a bar, pub, inn, tavern, hostelry, public house.",
];
const GITLAB_API_BASE_URL = "https://gitlab.com/api/v4/projects/";

const getLastYearsDate = () => {
  const now = new Date();
  return "" + new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();
};

const getDeployments = async (
  projectID: number,
  token: string,
  environment = "prod",
) => {
  const updatedAfter = getLastYearsDate();
  const apiParameters = new URLSearchParams({
    "updatedAfter": updatedAfter,
    environment,
    "status": "success",
  });
  const url = GITLAB_API_BASE_URL + projectID + "/deployments?" + apiParameters;
  console.log(url);
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: { "PRIVATE-TOKEN": token },
    });
    console.log(resp.status, resp.statusText);
    const data = await resp.json();
    console.log('results',data);
    return data;
  } catch (err) {
    console.error(err);
  }
};

export type Project = {
  projectID: number;
};

const processProject = async (projects:Array<Project>, results:Array<any> = []):Promise<any[]> =>{
  if (projects.length == 0){
    return results;
  }
  const project = projects.pop();
  if (!project){
    return results;
  }
  const production = await getDeployments(project.projectID, env.GITLAB_TOKEN, 'production');
  const prod = await getDeployments(project.projectID, env.GITLAB_TOKEN);
  results.push({production, prod});
  console.log('results are ', results);
  return await processProject(projects, results);
}

export const handler = async (
  _req: Request,
  _ctx: HandlerContext,
): Promise<Response> => {
  console.log(env.GITLAB_PROJECTS_FILE);
  const file = await Deno.readTextFile(env.GITLAB_PROJECTS_FILE);
  const projects: Array<Project> = JSON.parse(file);
  console.log('projects',projects);
  const data = await processProject(projects);
  console.log('data',data);
  const randomIndex = Math.floor(Math.random() * JOKES.length);
  const body = JSON.stringify({joke:JOKES[randomIndex], data});
  console.log('returning', body);
  return new Response(body);
};
