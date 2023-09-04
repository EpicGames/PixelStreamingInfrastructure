name: Experiment
on: 
  schedule:
  - cron: '*/5 * * * *'

jobs:
  job1:
    name: Debug
    runs-on: ubuntu-latest

    steps:
    - name: Git checkout
      uses: actions/checkout@v2
      with: { ref: debug }
    - name: List files
      run: ls
