The Netlify deploy errored, with the following guidance provided:

Diagnosis:
- [line 4](#L4) shows the build failing during the “preparing repo” stage. Netlify couldn’t check out the branch it was instructed to build, so the repository was never cloned and the build stopped immediately.

Solution:
- In the Netlify dashboard, open your site → Site settings → Build & deploy → Continuous deployment → Build settings. Confirm that “Branch to deploy” matches an existing branch in the repo (the repo currently only has `master`). Either point Netlify at `master` or create/push a `main` branch, then trigger a new deploy.

The relevant error logs are:

Line 0: build-image version: 996f0ea96f97c0291387fbccd9b699238a7384e2 (noble-new-builds)
Line 1: buildbot version: 82ffec010ece33e26e6ae786dec2fca533ea1141
Line 2: Building without cache
Line 3: Starting to prepare the repo for build
Line 4: Failed during stage 'preparing repo': For more information, visit https://docs.netlify.com/configure-builds/troubleshooting-tips
Line 5: Failing build: Failed to prepare repo
Line 6: Finished processing build request in 28.336s