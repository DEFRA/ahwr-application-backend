# Contributing

## Coding Standard

- The code needs to adhere to the [Defra JavaScript Standards](https://defra.github.io/software-development-standards/standards/javascript_standards/)
- Use [neostandard](https://github.com/neostandard/neostandard) to lint your code

## Commit Messages

Use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) with the ticket reference in the description for commit messages eg `feat: [AHWR-123] implemented poultry`

By default, a commit into the trunk will cause a `minor` version increment. If you need either the `major` or `patch` version, push a commit with `#major` or `#patch` in the commit message eg `feat: [AHWR-123] removed deprecated endpoint #major`
