# Welcome to Pixel Streaming contribution guide

First and foremost, thank you for your time and contribution to Pixel Streaming!

We are proud and excited to be a part of a passionate community that continuously helps us improve Pixel Streaming 🎉

If you are not familiar with contributing on GitHub, have a look at the [official documentation](https://docs.github.com/get-started) to learn more about repositories structure, forks, branches, commits, issues, and PRs.

### Code of conduct

Please remain patient, courteous, and professional at all times. Any form of spam, abuse, or discrimination will not be tolerated.

## Getting started

### Creating issues

If you have encountered a bug, have suggestions for our documentation or infrastructure, or would like to propose a feature that could enhance Pixel Streaming in various use case scenarios, you can raise this with us by creating a new issue.
1. First, search all open and closed issues [here](https://github.com/EpicGames/PixelStreamingInfrastructure/issues?q=is%3Aissue+) - your issue may have already been discussed or addressed.
2. If your issue doesn't exist, open a new issue [here](https://github.com/EpicGames/PixelStreamingInfrastructure/issues/new/choose) by selecting a bug or feature request.
3. Make sure to fill in the template as much as possible; any information you can provide, such as repro steps, crash stacks, screenshots, etc., can help us triage and fix the problem as quickly as possible.
4. Keep an eye on the status of your issue; our developers or other users might reach out with requests for more information. If this happens, issues that have not received a response in over 30 days will be automatically closed.
5. Be patient while waiting on a resolution; we prioritize the issues internally and some less critical features (however much we'd love to implement them!) will take a backseat to more pressing priorities, so some issues can take a while to get resolved.

### Creating pull requests (PR)

If you have a solution to a problem you've encountered or to any other open issue, you can create a pull request with your changes.
1. Fork the repo and branch off of the `main` branch in your fork.
2. Implement your changes in your branch and make sure your commits are Verified! Signed commits are required for merging! [Github Signing Documentation](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification)
3. Do as much testing as you can, and when you are happy, tidy up your work and commit the update.
4. Create a [pull request](https://github.com/EpicGames/PixelStreamingInfrastructure/pulls) and don't forget to link it to an issue if there's an existing one. Add as much information as possible to your PR: describe the problem your change solves, mention any testing you have done and attach any relevant documents and screenshots.
5. If your are contributing a PR for a new feature, we strongly encourage you to accompany it with relevant documentation and a detailed description of the tests you have done. PRs that don't have this information may take a long time to be addressed, since our team will have to do the testing.
6. If your PR is good to go, we will merge it in. Woohoo! Thank you for your time and efforts! 🎉
7. Keep a close eye on your PR - quite often, our developers will review your PR and leave comments; we might request some minor code changes and modifications, style unification, or leave any general comments and questions that are preventing us from merging the PR.
8. If we do not hear from you after requesting more information within 30 days, the PR will auto-close. In this case, we might elect to open our own PR and re-use some of the changes that you proposed, supplemented with anything else that was required to be added in your original PR.
9. If your PR fixes a problem in the previous [still-supported UE branches](https://github.com/EpicGames/PixelStreamingInfrastructure#versions), feel free to add the `auto-backport` and `auto-backport-to-UEX.X` labels. You'll need to add a `auto-backport-to-UEX.X` label for each branch you wish your change to be merged back to. Note that if a change to any of the previous branches is not trivial and requires a lot of testing and compatibility checks, we might elect to close it if we do not think that it brings enough value to the branch.

### Other ways to contribute

- Keep an eye on our repo and stay active on existing issues and PRs; you can help by adding informative comments to the discussions, additional repro steps, repros in different environments, or any suggestions as to what could be causing the issue and how it could be solved.
- Work on [issues labeled for community](https://github.com/EpicGames/PixelStreamingInfrastructure/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22). We specifically created this label to mark issues that we would love the community to help us with.
- Create documentation for undocumented features. Please open an issue first, so our developers can provide you with some guidance.
- Write more unit test coverage.
- Document functions in the public API that are not documented.
- Write new frontend implementations using another web framework, e.g. Angular, Vue, etc.
- Perform QA on different engine versions, particularly previews, and create issues based on the bugs that you have found.

## Coding style
 - TypeScript should be used over JavaScript.
 - All TypeScript should adhere to the following [linting rules](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/master/Frontend/library/.eslintrc.js).
 - Names should follow US English spelling.
 - All public functions/API should have comments.
 - Code formatting should adhere to the following [whitespace and indentation rules](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/master/Frontend/library/.prettierrc.json).
 - All new features should have accompanying unit tests and documentation when they are submitted.
 - Prefer early returns in `if` statements to decrease indentation.
 - Prefer functions to not exceed ~20 lines.
 - Prefer comments in longer functions.
 - Prefer verbosity over syntactic sugar.
 - Prefer exporting a minimal public API surface for iteration and support reasons.
 - Try not to exceed three levels of nesting in a function.

## Documentation style
All documentation should be written in US English and follow correct grammar and spelling. Endeavour to lay out the document in a logical fashion with headings, lists, and bullet points where appropriate.

Documentation should be broken up into separate `.md` files per directory, ideally with a `readme.md` file in the root of each top-level directory for a component to explain it. Where appropriate, these documentation pages should be linked to a table of contents in the relevant part of the repository.

## Legal

© 2004-2024, Epic Games, Inc. Unreal and its logo are Epic’s trademarks or registered trademarks in the US and elsewhere.
