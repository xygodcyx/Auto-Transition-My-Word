// ==UserScript==
// @name         Auto Translate My Word
// @namespace    http://github.com./xygodcyx/
// @version      1.0.0
// @description  try to take over the world!
// @author       XyGod
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mozilla.org
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
	('use strict');

	let selectText = '';

	/**
	 * @enum {any} wordStatus
	 */
	const WordStatus = {
		UNKNOWN: 'UNKNOWN',
		UNSKILLED: 'UNSKILLED',
		FAMILIAR: 'FAMILIAR',
	};

	/**
	 * @typedef {Object} WordInfo
	 * @property {string} text
	 * @property {string} translate
	 * @property {boolean} isLike
	 * @property {string} type
	 */

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
	/**
	 * wordCardDom
	 * @type {HTMLDivElement} wordCardDom - wordCardDom
	 */
	let wordCardDom = null;

	init();
	document.addEventListener('DOMContentLoaded', () => {
		initDoms();
		console.log(doms);
	});
	async function init() {
		await createWordCard();
		await deleteAllWord();
		await getWords();
		console.log('init', words);
		words.push({
			id: Math.random().toString(32).substring(2),
			text: 'selectText',
			wordStatus: WordStatus.UNKNOWN,
			searchCount: 0,
			addDate: Date.now(),
		});
		await saveWords();
		document.addEventListener('selectionchange', (e) => {
			selectText = document.getSelection().toString().trim();
		});

		console.log('get', words);
	}

	/**
	 * @typedef {Object} DomsType
	 * @property {HTMLElement} word_type
	 * @property {HTMLElement} word_text
	 * @property {HTMLElement} like_btn
	 * @property {HTMLElement} unlike_btn
	 * @property {HTMLElement} word_translate
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
	};
	async function initDoms() {
		return new Promise(async (resolve, reject) => {
			if (!wordCardDom) {
				await createWordCard();
			}
			if (!wordCardDom) {
				throw new Error('wordCardDom is null');
			}
			doms.like_btn = wordCardDom.querySelector(
				'.setting_card .like_wrap .like_btn'
			);
			doms.unlike_btn = wordCardDom.querySelector(
				'.setting_card .like_wrap  .unlike_btn'
			);
			doms.word_translate = wordCardDom.querySelector(
				'.translate_card .word_translate'
			);
			doms.word_type = wordCardDom.querySelector(
				'.origin_card .word_type'
			);
			doms.word_text = wordCardDom.querySelector(
				'.origin_card .word_text'
			);
			resolve(true);
		});
	}

	function createWordCard() {
		return new Promise((resolve, reject) => {
			try {
				const wordCardHtmlStr = `
                <div class="wordcard_wrap">
                    <div class="setting_card">
                        <div class="like_wrap">
                            <div class="like_btn icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                                    <path fill="currentColor"
                                        d="M22.5 5c-2.892 0-5.327 1.804-6.5 2.854C14.827 6.804 12.392 5 9.5 5C5.364 5 2 8.364 2 12.5c0 2.59 2.365 4.947 2.46 5.041L16 29.081l11.534-11.534C27.635 17.447 30 15.09 30 12.5C30 8.364 26.636 5 22.5 5" />
                                </svg>
                            </div>
                            <div class="hide unlike_btn icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                                    <path fill="currentColor"
                                        d="M9.5 5C5.363 5 2 8.402 2 12.5c0 1.43.648 2.668 1.25 3.563a9.25 9.25 0 0 0 1.219 1.468L15.28 28.375l.719.719l.719-.719L27.53 17.531S30 15.355 30 12.5C30 8.402 26.637 5 22.5 5c-3.434 0-5.645 2.066-6.5 2.938C15.145 7.066 12.934 5 9.5 5m0 2c2.988 0 5.75 2.906 5.75 2.906l.75.844l.75-.844S19.512 7 22.5 7c3.043 0 5.5 2.496 5.5 5.5c0 1.543-1.875 3.625-1.875 3.625L16 26.25L5.875 16.125s-.484-.465-.969-1.188C4.422 14.216 4 13.274 4 12.5C4 9.496 6.457 7 9.5 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div class="origin_card card">
                        <span class="word_type">n.</span>
                        <span class="word_text">declaration</span>
                    </div>
                    <div class="translate_card card">
                        <p class="word_translate">声明，表白；申报（单）；（板球）对一赛局结束的宣布；公告，宣告
                        </p>
                    </div>
                    <div class="more"></div>
                    </div>
                                    `;
				wordCardDom = document.createElement('div');
				wordCardDom.classList.add('wrap');
				wordCardDom.innerHTML = wordCardHtmlStr;
				document.body.appendChild(wordCardDom);
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async function showWordCard() {
		if (wordCardDom) {
			wordCardDom.classList.remove('hide');
		} else {
			await createWordCard();
		}
	}
	/**
	 * updateWordCard
	 * @param {WordInfo} wordInfo - wordInfo
	 */
	function updateWordCard(wordInfo) {}

	function hideWordCard() {
		if (wordCardDom) {
			wordCardDom.classList.add('hide');
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
		await GM.setValue('words', words);
	}
	async function getWords() {
		words = await GM.getValue('words', []);
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
		await GM.deleteValue('words');
		await saveWords();
	}
})();
