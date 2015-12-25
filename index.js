"use strict";

require('shelljs/global');
require('date-utils');
let opener = require('opener');

let issueUrl = "https://github.com/nyamogera/electron-christmas/issues/new?";
let issueLabels = "release";

if (!which('git')) {
  console.log('Sorry, this script requires git');
  exit(1);
}

let inquirer = require("inquirer");

class IssueData{
  constructor(){
    this.gitDir = "";
    this.releaseDate = "";
  }
}

let issueData = new IssueData();

/** ディレクトリの選択 */

let inquirerSelectDirectory = {
  "type": "list",
  "name": "gitdir",
  "message": "choice directory",
  "choices": ["../electron-christmas", ".", "other"]
};
let inquirerInputDirectory = {
  "type": "input",
  "name": "gitdir",
  "message": "input path"
};

let selectDir = new Promise((resolve, reject) => {
    inquirer.prompt([inquirerSelectDirectory], (answer) => {
      resolve(answer.gitdir);
    });
  }
);

/** ディレクトリの選択(結果) */

let resultDirectory = (value) => {
  return new Promise((resolve, reject) => {
    if (value == "other") {

      inquirer.prompt([inquirerInputDirectory], (answer) => {

        issueData.gitDir = `${answer.gitdir}`;
        resolve();
      });

    } else {
      issueData.gitDir = `${value}`;
      resolve();
    }
  })
};

/** 日付の選択 */

let dateList = [];

for(var i = 0; i < 7 ; i ++ ){
  let date = new Date();
  date.setDate(date.getDate() + i);

  let day = ['日','月','火','水','木','金','土'][date.getDay()];

  var formatted = date.toFormat("YYYY/MM/DD") + `(${day})`;
  dateList.push(formatted);
}
dateList.push( "other" );

let inquirerSelectDate = {
  "type": "list",
  "name": "releaseDate",
  "message": "choice date",
  "choices": dateList
};

let inquirerInputDate = {
  "type": "input",
  "name": "releaseDate",
  "message": "input date"
};



/** 日付の選択(結果) */
let selectDate = () => {
  return new Promise((resolve, reject) => {

    inquirer.prompt([inquirerSelectDate], (answer) => {
      resolve(answer.releaseDate);
    });
  })
};



/** 日付の選択(結果) */

let resultDate = (value) => {
  return new Promise((resolve, reject) => {
    if (value == "other") {
      inquirer.prompt([inquirerInputDate], (answer) => {
        issueData.releaseDate = answer.releaseDate;
        resolve();
      });

    } else {
      issueData.releaseDate = value;
      resolve();
    }
  })
};

let getContent = (gitdiff) => {

  let diffList = gitdiff.split("\n");

  var packageJsonContent = "";
  if( diffList.indexOf("M\tpackage.json") >= 0 ) {
    packageJsonContent = `# packagejsonに変更あり
packagejsonに変更あるよ`;
  }

  var indexHtmlContent = "";
  if( diffList.indexOf("M\tindex.html") >= 0 ) {
    indexHtmlContent = `# index.htmlに変更あり
- [ ] index.htmlで修正があった時にこういったバグが発生したことがあるからホニャララを重点的にチェックする。
`
  }

  return `# ${issueData.releaseDate} チェック項目一覧

## 差分一覧
${gitdiff}
${packageJsonContent}
${indexHtmlContent}
# リリース後確認処理
- [ ] developブランチをmasterにマージする

  `;
}

let showResult = () => {
  return new Promise((resolve,reject) => {
    console.log(`git-dir${issueData.gitDir}`);
    let gitdiff = exec(`git  --git-dir="${issueData.gitDir}/.git/" diff develop master --name-status`).output;
    console.log(gitdiff);
    console.log(`release-date:${issueData.releaseDate}`);

    let escapedTitle = encodeURIComponent(`${issueData.releaseDate} リリース時チェック項目`);
    let escapedContent = encodeURIComponent(getContent(gitdiff));

    opener(`${issueUrl}title=${escapedTitle}&body=${escapedContent}&labels=${issueLabels}`);
  });
}

selectDir.
then(resultDirectory).
then(selectDate).
then(resultDate).then(showResult);
