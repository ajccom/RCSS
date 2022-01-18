/** *************
R(eactive)CSS

write class then do nothing.

eg. <div class="pr15" ></div>

when you run it in browser, there will be a rule created by RCSS.

.pr15 { padding-right: 15px }

*****************/
const classNameMap = {};

function traveDom(dom, callback) {
  const { children } = dom;

  if (children && children.length) {
    for (let i = 0; i < children.length; i++) {
      traveDom(children[i], callback);
    }
  }

  try {
    callback && callback(dom);
  } catch (e) {
    console.log(e);
  }
}

function trackClassFromMutation(mutation) {
  if (!mutation) {
    return;
  }

  if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
    handleDomClass(mutation.target);
  }

  if (mutation.type === 'childList' && mutation.addedNodes.length) {
    traveDom(mutation.target, handleDomClass);
  }
}

function handleDomClass(dom) {
  if (!dom) {
    return;
  }

  const classList = dom.classList || [];
  for (let i = 0; i < classList.length; i++) {
    const item = classNameMap[classList[i]];
    if (item) {
      if (item.indexOf(dom) === -1) {
        item.push(dom);
      }
    } else {
      updateStyleSheetRules(classList[i]);
      classNameMap[classList[i]] = [dom];
    }
  }
}

let initObserver = function () {
  const observer = new MutationObserver(((mutationList) => {
    if (mutationList && mutationList.length) {
      for (let i = 0; i < mutationList.length; i++) {
        trackClassFromMutation(mutationList[i]);
      }
    }
  }));

  observer.observe(document, {
    subtree: true,
    childList: true,
    attributeFilter: ['class'],
  });

  initObserver = function () {
    console.warning('RCSS：不要重复调用初始化方法');
  };
};

const usedCSSRules = {
  w: 'width',
  h: 'height',
  p: 'padding',
  m: 'margin',
  fz: 'font-size',
  lh: 'line-height',
  pt: 'padding-top',
  pr: 'padding-right',
  pl: 'padding-left',
  pb: 'padding-bottom',
  mt: 'margin-top',
  mr: 'margin-right',
  ml: 'margin-left',
  mb: 'margin-bottom',
};

const styleSheetDom = document.createElement('style');

function initStyleDom() {
  document.head.appendChild(styleSheetDom);
}

function addRules(string) {
  styleSheetDom.innerHTML += string;
}

function updateStyleSheetRules(className) {
  if (!className) {
    return;
  }

  const result = /(\D+)(\d+)_?(\D+)?/ig.exec(className);
  if (!result) {
    return;
  }
  if (Object.keys(usedCSSRules).indexOf(result[1]) === -1) {
    return;
  };

  const ruleName = usedCSSRules[result[1]];
  const value = result[2];
  const unit = result[3] || 'px';

  const ruleString = `.${className} {${ruleName}: ${value}${unit} !important}`;

  addRules(ruleString);
}

function init() {
  initStyleDom();
  traveDom(document.documentElement, handleDomClass);
  initObserver();
}

const rcss = {
  init,
};

export default rcss;
