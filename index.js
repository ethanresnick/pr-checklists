const Checklist = require('./checklist')

const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path')

async function run() {
  try {

    const configFile = core.getInput('config')
    core.info('config: ' + configFile)

    const filePath = path.resolve(configFile)
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const mappings = data.mappings
    core.info('keyword to comment mappings found: \n' + JSON.stringify(mappings))

    const token = process.env.GITHUB_TOKEN || ''
    const octokit = new github.GitHub(token)
    const context = github.context;

    const prResponse = await octokit.pulls.get({
      pull_number: context.payload.pull_request.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      headers: {accept: "application/vnd.github.v3.diff"}
    });

    const {data: comments} = await octokit.pulls.listReviewComments({
      pull_number: context.payload.pull_request.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });

    core.debug('PR comments:');
    core.debug('----------------')
    core.debug(comments)
    core.debug('----------------')

    // if there's a prior comment by this bot, delete it
    // octokit.pulls.deleteReviewComment({
    //   owner: context.repo.owner,
    //   repo: context.repo.repo,
    //   comment_id: id,
    // });

    const prDiff = prResponse.data;
    core.debug('Pull request diff:')
    core.debug('----------------')
    core.debug(prDiff)
    core.debug('----------------')

    const onlyAddedLines = Checklist.getOnlyAddedLines(prDiff);
    core.debug('Newly added lines:')
    core.debug('----------------')
    core.debug(onlyAddedLines)
    core.debug('----------------')

    const checklist = Checklist.getFinalChecklist(onlyAddedLines, mappings);
    if (checklist && checklist.trim().length > 0) {
      octokit.issues.createComment({
        issue_number: context.payload.pull_request.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: checklist
      })
    } else {
      core.info("No dynamic checklist was created based on code difference and config file")
    }

    core.setOutput('checklist', checklist);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run()
