/*!
 *
 * jquery.fancytree.clones.js
 * Support faster lookup of nodes by key and shared ref-ids.
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * Copyright (c) 2008-2023, Martin Wendt (https://wwWendt.de)
 *
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 *
 * @version 2.38.5
 * @date 2025-04-05T06:40:00Z
 */

(function (factory) {
	if (typeof define === "function" && define.amd) {
		// AMD. Register as an anonymous module.
		define(["jquery", "./jquery.fancytree"], factory);
	} else if (typeof module === "object" && module.exports) {
		// Node/CommonJS
		require("./jquery.fancytree");
		module.exports = factory(require("jquery"));
	} else {
		// Browser globals
		factory(jQuery);
	}
})(function ($) {
	"use strict";

	/*******************************************************************************
	 * Private functions and variables
	 */

	var _assert = $.ui.fancytree.assert;

	/* Return first occurrence of member from array. */
	function _removeArrayMember(arr, elem) {
		// TODO: use Array.indexOf for IE >= 9
		var i;
		for (i = arr.length - 1; i >= 0; i--) {
			if (arr[i] === elem) {
				arr.splice(i, 1);
				return true;
			}
		}
		return false;
	}

	/**
	 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
	 *
	 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
	 * @see http://github.com/garycourt/murmurhash-js
	 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
	 * @see http://sites.google.com/site/murmurhash/
	 *
	 * @param {string} key ASCII only
	 * @param {boolean} [asString=false]
	 * @param {number} seed Positive integer only
	 * @return {number} 32-bit positive integer hash
	 */
	function hashMurmur3(key, asString, seed) {
		/*eslint-disable no-bitwise */
		var h1b,
			k1,
			remainder = key.length & 3,
			bytes = key.length - remainder,
			h1 = seed,
			c1 = 0xcc9e2d51,
			c2 = 0x1b873593,
			i = 0;

		while (i < bytes) {
			k1 =
				(key.charCodeAt(i) & 0xff) |
				((key.charCodeAt(++i) & 0xff) << 8) |
				((key.charCodeAt(++i) & 0xff) << 16) |
				((key.charCodeAt(++i) & 0xff) << 24);
			++i;

			k1 =
				((k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16)) &
				0xffffffff;
			k1 = (k1 << 15) | (k1 >>> 17);
			k1 =
				((k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16)) &
				0xffffffff;

			h1 ^= k1;
			h1 = (h1 << 13) | (h1 >>> 19);
			h1b =
				((h1 & 0xffff) * 5 + ((((h1 >>> 16) * 5) & 0xffff) << 16)) &
				0xffffffff;
			h1 =
				(h1b & 0xffff) +
				0x6b64 +
				((((h1b >>> 16) + 0xe654) & 0xffff) << 16);
		}

		k1 = 0;

		switch (remainder) {
			case 3:
				k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
			// fall through
			case 2:
				k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
			// fall through
			case 1:
				k1 ^= key.charCodeAt(i) & 0xff;

				k1 =
					((k1 & 0xffff) * c1 +
						((((k1 >>> 16) * c1) & 0xffff) << 16)) &
					0xffffffff;
				k1 = (k1 << 15) | (k1 >>> 17);
				k1 =
					((k1 & 0xffff) * c2 +
						((((k1 >>> 16) * c2) & 0xffff) << 16)) &
					0xffffffff;
				h1 ^= k1;
		}

		h1 ^= key.length;

		h1 ^= h1 >>> 16;
		h1 =
			((h1 & 0xffff) * 0x85ebca6b +
				((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) &
			0xffffffff;
		h1 ^= h1 >>> 13;
		h1 =
			((h1 & 0xffff) * 0xc2b2ae35 +
				((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16)) &
			0xffffffff;
		h1 ^= h1 >>> 16;

		if (asString) {
			// Convert to 8 digit hex string
			return ("0000000" + (h1 >>> 0).toString(16)).substr(-8);
		}
		return h1 >>> 0;
		/*eslint-enable no-bitwise */
	}

	/*
	 * Return a unique key for node by calculating the hash of the parents refKey-list.
	 */
	function calcUniqueKey(node) {
		var key,
			h1,
			path = $.map(node.getParentList(false, true), function (e) {
				return e.refKey || e.key;
			});

		path = path.join("/");
		// 32-bit has a high probability of collisions, so we pump up to 64-bit
		// https://security.stackexchange.com/q/209882/207588

		h1 = hashMurmur3(path, true);
		key = "id_" + h1 + hashMurmur3(h1 + path, true);

		return key;
	}

	/**
	 * [ext-clones] Return a list of clone-nodes (i.e. same refKey) or null.
	 * @param {boolean} [includeSelf=false]
	 * @returns {FancytreeNode[] | null}
	 *
	 * @alias FancytreeNode#getCloneList
	 * @requires jquery.fancytree.clones.js
	 */
	$.ui.fancytree._FancytreeNodeClass.prototype.getCloneList = function (
		includeSelf
	) {
		var key,
			tree = this.tree,
			refList = tree.refMap[this.refKey] || null,
			keyMap = tree.keyMap;

		if (refList) {
			key = this.key;
			// Convert key list to node list
			if (includeSelf) {
				refList = $.map(refList, function (val) {
					return keyMap[val];
				});
			} else {
				refList = $.map(refList, function (val) {
					return val === key ? null : keyMap[val];
				});
				if (refList.length < 1) {
					refList = null;
				}
			}
		}
		return refList;
	};

	/**
	 * [ext-clones] Return true if this node has at least another clone with same refKey.
	 * @returns {boolean}
	 *
	 * @alias FancytreeNode#isClone
	 * @requires jquery.fancytree.clones.js
	 */
	$.ui.fancytree._FancytreeNodeClass.prototype.isClone = function () {
		var refKey = this.refKey || null,
			refList = (refKey && this.tree.refMap[refKey]) || null;
		return !!(refList && refList.length > 1);
	};

	/**
	 * [ext-clones] Update key and/or refKey for an existing node.
	 * @param {string} key
	 * @param {string} refKey
	 * @returns {boolean}
	 *
	 * @alias FancytreeNode#reRegister
	 * @requires jquery.fancytree.clones.js
	 */
	$.ui.fancytree._FancytreeNodeClass.prototype.reRegister = function (
		key,
		refKey
	) {
		key = key == null ? null : "" + key;
		refKey = refKey == null ? null : "" + refKey;
		// this.debug("reRegister", key, refKey);

		var tree = this.tree,
			prevKey = this.key,
			prevRefKey = this.refKey,
			keyMap = tree.keyMap,
			refMap = tree.refMap,
			refList = refMap[prevRefKey] || null,
			//		curCloneKeys = refList ? node.getCloneList(true),
			modified = false;

		// Key has changed: update all references
		if (key != null && key !== this.key) {
			if (keyMap[key]) {
				$.error(
					"[ext-clones] reRegister(" +
						key +
						"): already exists: " +
						this
				);
			}
			// Update keyMap
			delete keyMap[prevKey];
			keyMap[key] = this;
			// Update refMap
			if (refList) {
				refMap[prevRefKey] = $.map(refList, function (e) {
					return e === prevKey ? key : e;
				});
			}
			this.key = key;
			modified = true;
		}

		// refKey has changed
		if (refKey != null && refKey !== this.refKey) {
			// Remove previous refKeys
			if (refList) {
				if (refList.length === 1) {
					delete refMap[prevRefKey];
				} else {
					refMap[prevRefKey] = $.map(refList, function (e) {
						return e === prevKey ? null : e;
					});
				}
			}
			// Add refKey
			if (refMap[refKey]) {
				refMap[refKey].append(key);
			} else {
				refMap[refKey] = [this.key];
			}
			this.refKey = refKey;
			modified = true;
		}
		return modified;
	};

	/**
	 * [ext-clones] Define a refKey for an existing node.
	 * @param {string} refKey
	 * @returns {boolean}
	 *
	 * @alias FancytreeNode#setRefKey
	 * @requires jquery.fancytree.clones.js
	 * @since 2.16
	 */
	$.ui.fancytree._FancytreeNodeClass.prototype.setRefKey = function (refKey) {
		return this.reRegister(null, refKey);
	};

	/**
	 * [ext-clones] Return all nodes with a given refKey (null if not found).
	 * @param {string} refKey
	 * @param {FancytreeNode} [rootNode] optionally restrict results to descendants of this node
	 * @returns {FancytreeNode[] | null}
	 * @alias Fancytree#getNodesByRef
	 * @requires jquery.fancytree.clones.js
	 */
	$.ui.fancytree._FancytreeClass.prototype.getNodesByRef = function (
		refKey,
		rootNode
	) {
		var keyMap = this.keyMap,
			refList = this.refMap[refKey] || null;

		if (refList) {
			// Convert key list to node list
			if (rootNode) {
				refList = $.map(refList, function (val) {
					var node = keyMap[val];
					return node.isDescendantOf(rootNode) ? node : null;
				});
			} else {
				refList = $.map(refList, function (val) {
					return keyMap[val];
				});
			}
			if (refList.length < 1) {
				refList = null;
			}
		}
		return refList;
	};

	/**
	 * [ext-clones] Replace a refKey with a new one.
	 * @param {string} oldRefKey
	 * @param {string} newRefKey
	 * @alias Fancytree#changeRefKey
	 * @requires jquery.fancytree.clones.js
	 */
	$.ui.fancytree._FancytreeClass.prototype.changeRefKey = function (
		oldRefKey,
		newRefKey
	) {
		var i,
			node,
			keyMap = this.keyMap,
			refList = this.refMap[oldRefKey] || null;

		if (refList) {
			for (i = 0; i < refList.length; i++) {
				node = keyMap[refList[i]];
				node.refKey = newRefKey;
			}
			delete this.refMap[oldRefKey];
			this.refMap[newRefKey] = refList;
		}
	};

	/*******************************************************************************
	 * Extension code
	 */
	$.ui.fancytree.registerExtension({
		name: "clones",
		version: "2.38.5",
		// Default options for this extension.
		options: {
			highlightActiveClones: true, // set 'fancytree-active-clone' on active clones and all peers
			highlightClones: false, // set 'fancytree-clone' class on any node that has at least one clone
		},

		treeCreate: function (ctx) {
			this._superApply(arguments);
			ctx.tree.refMap = {};
			ctx.tree.keyMap = {};
		},
		treeInit: function (ctx) {
			this.$container.addClass("fancytree-ext-clones");
			_assert(ctx.options.defaultKey == null);
			// Generate unique / reproducible default keys
			ctx.options.defaultKey = function (node) {
				return calcUniqueKey(node);
			};
			// The default implementation loads initial data
			this._superApply(arguments);
		},
		treeClear: function (ctx) {
			ctx.tree.refMap = {};
			ctx.tree.keyMap = {};
			return this._superApply(arguments);
		},
		treeRegisterNode: function (ctx, add, node) {
			var refList,
				len,
				tree = ctx.tree,
				keyMap = tree.keyMap,
				refMap = tree.refMap,
				key = node.key,
				refKey = node && node.refKey != null ? "" + node.refKey : null;

			//		ctx.tree.debug("clones.treeRegisterNode", add, node);

			if (node.isStatusNode()) {
				return this._super(ctx, add, node);
			}

			if (add) {
				if (keyMap[node.key] != null) {
					var other = keyMap[node.key],
						msg =
							"clones.treeRegisterNode: duplicate key '" +
							node.key +
							"': /" +
							node.getPath(true) +
							" => " +
							other.getPath(true);
					// Sometimes this exception is not visible in the console,
					// so we also write it:
					tree.error(msg);
					$.error(msg);
				}
				keyMap[key] = node;

				if (refKey) {
					refList = refMap[refKey];
					if (refList) {
						refList.push(key);
						if (
							refList.length === 2 &&
							ctx.options.clones.highlightClones
						) {
							// Mark peer node, if it just became a clone (no need to
							// mark current node, since it will be rendered later anyway)
							keyMap[refList[0]].renderStatus();
						}
					} else {
						refMap[refKey] = [key];
					}
					// node.debug("clones.treeRegisterNode: add clone =>", refMap[refKey]);
				}
			} else {
				if (keyMap[key] == null) {
					$.error(
						"clones.treeRegisterNode: node.key not registered: " +
							node.key
					);
				}
				delete keyMap[key];
				if (refKey) {
					refList = refMap[refKey];
					// node.debug("clones.treeRegisterNode: remove clone BEFORE =>", refMap[refKey]);
					if (refList) {
						len = refList.length;
						if (len <= 1) {
							_assert(len === 1);
							_assert(refList[0] === key);
							delete refMap[refKey];
						} else {
							_removeArrayMember(refList, key);
							// Unmark peer node, if this was the only clone
							if (
								len === 2 &&
								ctx.options.clones.highlightClones
							) {
								//							node.debug("clones.treeRegisterNode: last =>", node.getCloneList());
								keyMap[refList[0]].renderStatus();
							}
						}
						// node.debug("clones.treeRegisterNode: remove clone =>", refMap[refKey]);
					}
				}
			}
			return this._super(ctx, add, node);
		},
		nodeRenderStatus: function (ctx) {
			var $span,
				res,
				node = ctx.node;

			res = this._super(ctx);

			if (ctx.options.clones.highlightClones) {
				$span = $(node[ctx.tree.statusClassPropName]);
				// Only if span already exists
				if ($span.length && node.isClone()) {
					//				node.debug("clones.nodeRenderStatus: ", ctx.options.clones.highlightClones);
					$span.addClass("fancytree-clone");
				}
			}
			return res;
		},
		nodeSetActive: function (ctx, flag, callOpts) {
			var res,
				scpn = ctx.tree.statusClassPropName,
				node = ctx.node;

			res = this._superApply(arguments);

			if (ctx.options.clones.highlightActiveClones && node.isClone()) {
				$.each(node.getCloneList(true), function (idx, n) {
					// n.debug("clones.nodeSetActive: ", flag !== false);
					$(n[scpn]).toggleClass(
						"fancytree-active-clone",
						flag !== false
					);
				});
			}
			return res;
		},
	});
	// Value returned by `require('jquery.fancytree..')`
	return $.ui.fancytree;
}); // End of closure
