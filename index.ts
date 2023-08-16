import * as Checklist from "./checklist.js";
import core from "@actions/core";
import github from "@actions/github";
import fs from "fs";
import path from "path";

async function run() {
  try {
    const configFile = core.getInput("config");
    core.info("config: " + configFile);

    const filePath = path.resolve(configFile);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const mappings = data.mappings;
    core.info(
      "keyword to comment mappings found: \n" + JSON.stringify(mappings)
    );

    const token = process.env["GITHUB_TOKEN"] || "";
    const octokit = github.getOctokit(token);
    const context = github.context;

    const prResponse = (await octokit.rest.pulls.get({
      pull_number: context.payload.pull_request!.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      mediaType: { format: "patch" },
      // when we request { format: 'patch' }, we get a string back, but the
      // octocat types incorrectly assume we're always getting json back.
    })) as unknown as { data: string };

    const { data: comments } = await octokit.rest.issues.listComments({
      issue_number: context.payload.pull_request!.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });

    core.debug("PR comments:");
    core.debug("----------------");
    core.debug(JSON.stringify(comments));
    core.debug("----------------");

    // if there's a prior comment by this bot, delete it
    const oldPRComment = comments.find(
      (it) =>
        it.user?.login == "github-actions[bot]" &&
        it.body?.includes("**Checklist:**")
    );

    if (oldPRComment) {
      core.info("deleting old checklist comment");
      await octokit.rest.issues.deleteComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        comment_id: oldPRComment.id,
      });
    }

    const prDiff = prResponse.data;
    core.debug("Pull request diff:");
    core.debug("----------------");
    core.debug(prDiff);
    core.debug("----------------");

    const checklist = Checklist.getFormattedChecklist(prDiff, mappings);
    if (checklist && checklist.trim().length > 0) {
      octokit.rest.issues.createComment({
        issue_number: context.payload.pull_request!.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: checklist,
      });
    } else {
      core.info(
        "No dynamic checklist was created based on code difference and config file"
      );
    }

    core.setOutput("checklist", checklist);
  } catch (error) {
    core.setFailed((error as Error).message ?? "Unknown error");
  }
}

run();
