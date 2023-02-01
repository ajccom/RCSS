/** *************
R(eactive)CSS
write class then do nothing.
eg. <div class="pr15" ></div>
when you run it in browser, there will be a rule created by RCSS.
.pr15 { padding-right: 15px }
*****************/
declare global {
  interface Console {
    warning: (payload: any) => void
  }
}

let stack: MutationRecord[] = [];
let isNeedClearStack = false;

const classNameMap: { [key: string]: HTMLElement[] | Node[] }  = {};

function traveDom(dom: HTMLElement | Node, callback: (dom: HTMLElement | Node) => void) {
  const children = (dom as HTMLElement).children || dom.childNodes;

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

function trackClassFromMutation() {
  while (stack.length) {
    const mutation = stack.shift() as MutationRecord;

    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        handleDomClass(mutation.target);
    }

    if (mutation.type === 'childList' && mutation.addedNodes.length) {
        traveDom(mutation.target, handleDomClass);
    }
  }
}

function handleDomClass(dom: HTMLElement | Node) {
  if (!dom) {
    return;
  }

  const classList = (dom as HTMLElement).classList || [];
  for (let i = 0; i < classList.length; i++) {
    const item: HTMLElement[] | Node[] = classNameMap[classList[i]];
    if (item) {
      if (item.indexOf(dom as HTMLElement) === -1) {
        item.push(dom as HTMLElement);
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
        stack.push(mutationList[i]);
      }
    }
    isNeedClearStack = true;
  }));

  observer.observe(document, {
    subtree: true,
    childList: true,
    attributeFilter: ['class'],
  });

  initObserver = function () {
    console.warning('RCSS：不要重复调用初始化方法');
  };

  setInterval(() => {
    if (isNeedClearStack) {
      trackClassFromMutation();
      isNeedClearStack = false;
    }
  }, 40);
};

const usedCSSRules: { [key: string]: string } = {
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

function addRules(string: string) {
  styleSheetDom.innerHTML += string;
}

function updateStyleSheetRules(className: string) {
  if (!className) {
    return;
  }

  const result: RegExpExecArray | null = /(\D+)(\d+)_?(\D+)?/ig.exec(className);
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
