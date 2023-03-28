# Cutting releases

There are multiple things in this repository that can be released:

- The signalling server container image
- The `/library` NPM package
- The `/ui-library` NPM package
- The entire repo and built frontend as a Github release .zip/tar.gz archive

## Signalling Server Container
1. Switch to the target branch (e.g 5.2)
2. Make/merge any changes into `/SignallingWebServer` directory
3. This will automatically kick off a [this action](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/master/.github/workflows/container-images.yml) for a build+push of the signalling server container image.

## The `/library` NPM package
1. Switch to the target branch (e.g 5.2)
2. Make/merge any changes into `/library` directory
3. Based on the changes made, bump the version number according to [semver](https://semver.org/) in the [`package.json`](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/30611b625736f49b7f407204ee3b0c455cb3130b/Frontend/library/package.json#L3) file
4. Commit the changes to the `package.json` file.
5. This will automatically kick off a [this action](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/master/.github/workflows/publish-library-to-npm.yml) for a build+push to NPM.

## The `ui-library` NPM package
1. Switch to the target branch (e.g 5.2)
2. Make/merge any changes into `/ui-library` directory
3. Based on the changes made, bump the version number according to [semver](https://semver.org/) in the [`package.json`](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/30611b625736f49b7f407204ee3b0c455cb3130b/Frontend/ui-library/package.json#L3) file
4. **Optional: Update the version of the core library in the package.json if it got bumped ([here](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/fa79612282fe7ff7a81c2d1929280ef168069992/Frontend/ui-library/package.json#L19) & [here](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/fa79612282fe7ff7a81c2d1929280ef168069992/Frontend/ui-library/package.json#L37)).**
5. Commit the changes to `package.json` and potentially the `package-lock.json` file.
6. This will automatically kick off a [this action](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/master/.github/workflows/publish-ui-library-to-npm.yml) for a build+push to NPM.

## The Github releases archives
1. Switch to the target branch (e.g 5.2)
2. Make/merge any changes anywhere in the repo.
3. Based on the changes made, bump the version number according to [semver](https://semver.org/) in the [`RELEASE_VERSION`](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/master/RELEASE_VERSION) file.
4. Commit the changes to `RELEASE_VERSION` file.
6. This will automatically kick off a [this action](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/master/.github/workflows/create-gh-release.yml) for tagged Github release with .zip and .tar.gz archives.

## Handling multiple changes
If multiple changes have been made, the order of releases should usually be like so:

1. `/library`
2. `/ui-library`
3. `RELEASE_VERSION` file
