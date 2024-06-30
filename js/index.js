// ==UserScript==
// @name         Auto Translate My Word
// @namespace    http://github.com./xygodcyx/
// @version      1.0.0
// @description  try to take over the world!
// @author       XyGod
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mozilla.org
// @inject-into content
// @grant       GM_getResourceText
// @connect     zntuch.natappfree.cc
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addElement
// @grant       GM.addElement
// @grant       GM_listValues
// @grant       GM_deleteValue
// @grant       GM.listValues
// @grant       GM.deleteValue
// @grant       GM_xmlhttpRequest
// @grant       GM_registerMenuCommand
// @grant       GM_addStyle
// @grant       GM.addStyle
// @grant       GM_openInTab
// @grant       GM.openInTab
// ==/UserScript==

(function () {
	('use strict');

	let selectText = '';

	/**
	 * wordCardDom
	 * @type {HTMLDivElement} wordCardDom - wordCardDom
	 */
	let wordCardWrapDom = null;

	/**
	 * @enum {any} wordStatus
	 */
	const WordStatus = {
		UNKNOWN: 'UNKNOWN',
		UNSKILLED: 'UNSKILLED',
		FAMILIAR: 'FAMILIAR',
	};

	/**
	 * @typedef {Object} WordType
	 * @property {number} id
	 * @property {string} text
	 * @property {string} translate
	 * @property {boolean} isLike
	 * @property {string} type
	 * @property {WordStatus} wordStatus
	 * @property {number} searchCount
	 * @property {number} addDate
	 */

	let isCardExist = false;
	let currentWordCard = null;
	let isWordCardShow = false;

	let isMouseDown = false;
	let isMouseUp = false;
	let isSelectionchange = false;
	let isMouseEnterWordCardWrap = false;
	let isMouseLevelWordCardWrap = false;

	init();
	async function init() {
		return new Promise(async (resolve, reject) => {
			await createWordCard();
			// await deleteAllWord();
			await getWords();
			resolve();
			initDoms();
			hideWordCard();
			if (typeof GM_getResourceText !== 'undefined') {
				addStyle();
			}
			document.addEventListener('mousedown', () => {
				isMouseDown = true;
				isMouseUp = false;
				isSelectionchange = false;
			});
			document.addEventListener('mouseup', () => {
				isMouseUp = true;
				isMouseDown = false;
				if (isSelectionchange && selectText) {
					wordInfo.text = selectText;
					showWordCard();
				}
				isSelectionchange = false;
			});

			document.addEventListener('selectionchange', (e) => {
				isSelectionchange = true;
				if (isMouseEnterWordCardWrap) {
					return;
				}
				selectText = document.getSelection().toString().trim();
			});

			let timeout = null;
			wordCardWrapDom.addEventListener('mouseleave', (e) => {
				isMouseLevelWordCardWrap = true;
				isMouseEnterWordCardWrap = false;
				timeout = setTimeout(() => {
					hideWordCard();
				}, 300);
			});
			wordCardWrapDom.addEventListener('mouseenter', (e) => {
				isMouseEnterWordCardWrap = true;
				isMouseLevelWordCardWrap = false;
				clearTimeout(timeout);
				if (!isWordCardShow) showWordCard();
			});
			document.addEventListener('mousedown', () => {
				if (isMouseLevelWordCardWrap && isWordCardShow) {
					hideWordCard();
				}
			});

			resolve(true);
		});
	}

	async function sendTranslateRequest() {
		// q	text	待翻译文本	True	必须是UTF-8编码
		// from	text	源语言	True	参考下方 支持语言
		// to	text	目标语言	True	参考下方 支持语言
		// appKey	text	应用ID	True	可在应用管理 查看
		// salt	text	UUID	True	uuid，唯一通用识别码
		// sign	text	签名	True	sha256(应用ID+input+salt+curtime+应用密钥)
		// signType	text	签名类型	True	v3
		// curtime	text	当前UTC时间戳(秒)	true	TimeStamp
		const dev_url = 'http://127.0.0.1/translate';
		const product_url = 'http://zntuch.natappfree.cc/translate';
		const dev = false;
		GM_xmlhttpRequest({
			method: 'POST',
			url: dev ? dev_url : product_url,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				text: wordInfo.text,
				fromLang: 'en',
				targetLang: 'zh-CHS',
			}),
			onload: function (response) {
				const data = JSON.parse(response.responseText);
				console.log(data);
				if (data.translation) {
					wordInfo.translate = data.translation;
					doms.word_translate.textContent = wordInfo.translate;
				}
			},
			onerror: function (error) {
				console.error('Error:', error);
			},
		});
	}

	/**
	 * @typedef {Object} DomsType
	 * @property {HTMLElement} word_type
	 * @property {HTMLElement} word_text
	 * @property {HTMLElement} like_btn
	 * @property {HTMLElement} unlike_btn
	 * @property {HTMLElement} word_translate
	 * @property {HTMLElement} wordCard_wrap
	 */

	/**
	 * doms
	 * @type {DomsType} doms - doms
	 */
	let doms = {
		word_type: null,
		word_text: null,
		like_btn: null,
		unlike_btn: null,
		word_translate: null,
		wordCard_wrap: null,
	};
	async function initDoms() {
		return new Promise(async (resolve, reject) => {
			if (!wordCardWrapDom) {
				await createWordCard();
			}
			if (!wordCardWrapDom) {
				throw new Error('wordCardDom is null');
			}
			doms.like_btn = wordCardWrapDom.querySelector(
				'.XyGod_AutoTranslate_wordCard_wrap .XyGod_AutoTranslate_setting_card .XyGod_AutoTranslate_like_wrap .XyGod_AutoTranslate_like_btn'
			);
			doms.unlike_btn = wordCardWrapDom.querySelector(
				'.XyGod_AutoTranslate_wordCard_wrap .XyGod_AutoTranslate_setting_card .XyGod_AutoTranslate_like_wrap  .XyGod_AutoTranslate_unlike_btn'
			);
			doms.word_translate = wordCardWrapDom.querySelector(
				'.XyGod_AutoTranslate_wordCard_wrap .XyGod_AutoTranslate_translate_card .XyGod_AutoTranslate_word_translate'
			);
			doms.word_type = wordCardWrapDom.querySelector(
				'.XyGod_AutoTranslate_wordCard_wrap .XyGod_AutoTranslate_origin_card .XyGod_AutoTranslate_word_type'
			);
			doms.word_text = wordCardWrapDom.querySelector(
				'.XyGod_AutoTranslate_wordCard_wrap .XyGod_AutoTranslate_origin_card .XyGod_AutoTranslate_word_text'
			);
			doms.wordCard_wrap = wordCardWrapDom.querySelector(
				'.XyGod_AutoTranslate_wordCard_wrap'
			);
			doms.like_btn.addEventListener('click', () => {
				like();
			});
			doms.unlike_btn.addEventListener('click', () => {
				unlike();
			});
			console.log(doms);
			resolve(true);
		});
	}

	/**
	 * @typedef {Object} WordCardPositionType
	 * @property {number} left
	 * @property {number} top
	 */

	function createWordCard() {
		return new Promise((resolve, reject) => {
			try {
				const wordCardHtmlStr = `
                <div class="XyGod_AutoTranslate_wordCard_wrap">
                    <div class="XyGod_AutoTranslate_setting_card">
                        <div class="XyGod_AutoTranslate_like_wrap">
                            <div class="XyGod_AutoTranslate_like_btn XyGod_AutoTranslate_icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                                    <path fill="currentColor"
                                        d="M22.5 5c-2.892 0-5.327 1.804-6.5 2.854C14.827 6.804 12.392 5 9.5 5C5.364 5 2 8.364 2 12.5c0 2.59 2.365 4.947 2.46 5.041L16 29.081l11.534-11.534C27.635 17.447 30 15.09 30 12.5C30 8.364 26.636 5 22.5 5" />
                                </svg>
                            </div>
                            <div class="XyGod_AutoTranslate_hide XyGod_AutoTranslate_unlike_btn XyGod_AutoTranslate_icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                                    <path fill="currentColor"
                                        d="M9.5 5C5.363 5 2 8.402 2 12.5c0 1.43.648 2.668 1.25 3.563a9.25 9.25 0 0 0 1.219 1.468L15.28 28.375l.719.719l.719-.719L27.53 17.531S30 15.355 30 12.5C30 8.402 26.637 5 22.5 5c-3.434 0-5.645 2.066-6.5 2.938C15.145 7.066 12.934 5 9.5 5m0 2c2.988 0 5.75 2.906 5.75 2.906l.75.844l.75-.844S19.512 7 22.5 7c3.043 0 5.5 2.496 5.5 5.5c0 1.543-1.875 3.625-1.875 3.625L16 26.25L5.875 16.125s-.484-.465-.969-1.188C4.422 14.216 4 13.274 4 12.5C4 9.496 6.457 7 9.5 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div class="XyGod_AutoTranslate_origin_card XyGod_AutoTranslate_card">
                        <span class="XyGod_AutoTranslate_word_type">n.</span>
                        <span class="XyGod_AutoTranslate_word_text">declaration</span>
                    </div>
                    <div class="XyGod_AutoTranslate_translate_card XyGod_AutoTranslate_card">
                        <p class="XyGod_AutoTranslate_word_translate">声明，表白；申报（单）；（板球）对一赛局结束的宣布；公告，宣告
                        </p>
                    </div>
                    <div class="XyGod_AutoTranslate_more"></div>
                    </div>
                                    `;
				wordCardWrapDom = document.createElement('div');
				wordCardWrapDom.classList.add('XyGod_AutoTranslate_WordWrap');
				wordCardWrapDom.id = 'XyGod_AutoTranslate_WordWrap';
				wordCardWrapDom.innerHTML = wordCardHtmlStr;
				document.body.appendChild(wordCardWrapDom);
				resolve(true);
				window.addEventListener('mousemove', (e) => {
					wordInfo.wordCardPosition.left = e.clientX;
					wordInfo.wordCardPosition.top = e.clientY;
					updateWordCardPosition(wordInfo);
				});
			} catch (err) {
				reject(err);
			}
		});
	}

	/**
	 * @typedef {Object} WordInfo
	 * @property {string} text
	 * @property {string} translate
	 * @property {boolean} isLike
	 * @property {string} type
	 * @property {WordCardPositionType} wordCardPosition
	 * @property {string} searchCount
	 */

	/**
	 * wordInfo
	 * @type {WordInfo} wordInfo - wordInfo
	 */
	const wordInfo = {
		id: '',
		text: '',
		translate: '',
		isLike: false,
		type: '',
		wordCardPosition: {
			left: 0,
			top: 0,
		},
		searchCount: 0,
	};

	/**
	 * updateWordCard
	 * @param {WordInfo} wordInfo - wordInfo
	 */
	function updateWordCardPosition(wordInfo) {
		if (!wordCardWrapDom) {
			return;
		}
		if (isWordCardShow) {
			return;
		}
		wordCardWrapDom.style.left = wordInfo.wordCardPosition.left + 'px';
		wordCardWrapDom.style.top =
			+wordInfo.wordCardPosition.top -
			+doms.wordCard_wrap.clientHeight +
			'px';
	}
	async function showWordCard() {
		if (wordCardWrapDom) {
			wordCardWrapDom.classList.remove('XyGod_AutoTranslate_hide');
			isWordCardShow = true;
			doms.word_text.textContent = wordInfo.text;

			sendTranslateRequest();
			const word = getWordInWords(wordInfo.text);
			if (word) {
				wordInfo.isLike = word.isLike;
				updateWord(word.text, word.searchCount + 1);
				showLike();
			} else {
				showUnLike();
			}
		} else {
			await createWordCard();
		}
	}

	function hideWordCard() {
		if (wordCardWrapDom) {
			wordCardWrapDom.classList.add('XyGod_AutoTranslate_hide');
			isWordCardShow = false;
		}
	}

	function getMatchWord() {
		let matchWord = words.find((word) => word.word == selectText);
		return matchWord;
	}
	/**
	 * @type {Array<WordType>} words - words
	 */
	let words = [];
	async function saveWords() {
		if (typeof GM === 'undefined') return;
		await GM?.setValue('words', words);
	}
	async function getWords() {
		if (typeof GM === 'undefined') return;
		words = await GM?.getValue('words', []);
	}

	function getWordInWords(text, translate) {
		let result = words.find((word) => word.text === text);
		return result;
	}
	function getWordIndexInWords(text) {
		let result = words.findIndex((word) => word.text === text);
		return result;
	}

	async function addWord() {
		const word = getWordInWords(wordInfo.text);
		if (word) {
			console.warn(`${text} already exist`);
			return;
		}
		words.push({
			id: Math.random().toString(16).substring(2),
			isLike: wordInfo.isLike,
			text: wordInfo.text,
			translate: wordInfo.translate ? wordInfo.translate : '暂无翻译',
			wordStatus: WordStatus.UNKNOWN,
			searchCount: 0,
			addDate: Date.now(),
		});
		await saveWords();
	}
	function updateWord(text, searchCount) {
		const index = getWordIndexInWords(text);
		const word = words[index];
		if (!word) {
			console.warn(`${text} is not exist`);
			return;
		}
		words[index].searchCount = searchCount;
		saveWords();
	}

	async function deleteWord(id) {
		words.forEach((word) => {
			if (word.id == id) {
				words.splice(words.indexOf(word), 1);
			}
		});
		await saveWords();
	}
	async function deleteAllWord() {
		if (typeof GM === 'undefined') return;
		await GM?.deleteValue('words');
		await saveWords();
	}
	async function like() {
		wordInfo.isLike = false;
		showUnLike();
		const word = getWordInWords(wordInfo.text);
		if (word) {
			deleteWord(word.id);
		}
		await saveWords();

		console.log('curWordLike', wordInfo.isLike);
		console.log(words);
	}
	function showLike() {
		doms.unlike_btn.classList.toggle('XyGod_AutoTranslate_hide', true);
		doms.like_btn.classList.toggle('XyGod_AutoTranslate_hide', false);
	}
	function showUnLike() {
		doms.unlike_btn.classList.toggle('XyGod_AutoTranslate_hide', false);
		doms.like_btn.classList.toggle('XyGod_AutoTranslate_hide', true);
	}
	async function unlike() {
		wordInfo.isLike = true;
		showLike();
		await addWord();
		console.log('curWordLike', wordInfo.isLike);
		console.log(words);
	}

	function addStyle() {
		GM_addStyle(`
        #XyGod_AutoTranslate_WordWrap.XyGod_AutoTranslate_WordWrap * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
#XyGod_AutoTranslate_WordWrap {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 99999999 !important;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  --red: #f00056;
  --black: #424c50;
  --white: #ffffff;
}
#XyGod_AutoTranslate_WordWrap svg {
  width: 100%;
  height: 100%;
  color: inherit;
  fill: currentColor;
  stroke: currentColor;
  stroke-width: 0;
}
#XyGod_AutoTranslate_WordWrap.XyGod_AutoTranslate_hide {
  display: none;
}
#XyGod_AutoTranslate_WordWrap .XyGod_AutoTranslate_wordCard_wrap {
  width: -webkit-fit-content;
  width: fit-content;
  min-width: 130px;
  max-width: var(--max_width);
  height: -webkit-fit-content;
  height: fit-content;
  min-height: var(--min_height);
  max-height: 300px;
  background-color: antiquewhite;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  text-overflow: ellipsis;
  --max_width: 200px;
  --min_height: 30px;
}
#XyGod_AutoTranslate_WordWrap .XyGod_AutoTranslate_wordCard_wrap .XyGod_AutoTranslate_card {
  width: -webkit-fit-content;
  width: fit-content;
  min-width: 130px;
  max-width: var(--max_width);
  height: -webkit-fit-content;
  height: fit-content;
  padding: 0 30px 5px 5px;
}
#XyGod_AutoTranslate_WordWrap .XyGod_AutoTranslate_wordCard_wrap .XyGod_AutoTranslate_setting_card {
  position: absolute;
  right: 5px;
  top: 5px;
}
#XyGod_AutoTranslate_WordWrap .XyGod_AutoTranslate_wordCard_wrap .XyGod_AutoTranslate_setting_card .XyGod_AutoTranslate_like_wrap {
  width: 20px;
  height: 20px;
  position: block;
}
#XyGod_AutoTranslate_WordWrap .XyGod_AutoTranslate_wordCard_wrap .XyGod_AutoTranslate_setting_card .XyGod_AutoTranslate_like_wrap .XyGod_AutoTranslate_like_btn {
  color: var(--red);
}
#XyGod_AutoTranslate_WordWrap .XyGod_AutoTranslate_wordCard_wrap .XyGod_AutoTranslate_setting_card .XyGod_AutoTranslate_like_wrap .XyGod_AutoTranslate_icon {
  width: 100%;
  height: 100%;
  cursor: pointer;
  display: block;
}
#XyGod_AutoTranslate_WordWrap .XyGod_AutoTranslate_wordCard_wrap .XyGod_AutoTranslate_setting_card .XyGod_AutoTranslate_like_wrap .XyGod_AutoTranslate_icon.XyGod_AutoTranslate_hide {
  display: none;
}
#XyGod_AutoTranslate_WordWrap .XyGod_AutoTranslate_wordCard_wrap .XyGod_AutoTranslate_origin_card {
  color: #161823;
  word-wrap: break-word;
}
#XyGod_AutoTranslate_WordWrap .XyGod_AutoTranslate_wordCard_wrap .XyGod_AutoTranslate_translate_card {
  color: #161823;
  font-size: 1em;
  word-wrap: break-word;
  border-radius: 5px;
}

`);
	}
})();
