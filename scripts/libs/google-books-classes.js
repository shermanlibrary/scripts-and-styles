/*
 *   GBS - Google Book Classes
 *
 *   Copyright 2008, 2009 by Godmar Back godmar@gmail.com 
 *
 *   License: This software is released under the LGPL license,
 *   See http://www.gnu.org/licenses/lgpl.txt
 *
 *   $Id: gbsclasses.js 5 2010-04-09 19:13:58Z godmar@gmail.com $
 *
 *   Instructions:
 *   ------------
 *
 *  Add <script type="text/javascript" src="gbsclasses.js"></script>
 *  to your document.
 *
 *  This file can be used stand-alone, without any supporting libraries.
 */

(function() {

gbs = {
    isReady: false,
    readyListeners: new Array()
};

/*****************************************************************/
/*
 * Add an event handler, browser-compatible.
 * This code taken from http://www.dustindiaz.com/rock-solid-addevent/
 * See also http://www.quirksmode.org/js/events_compinfo.html
 *          http://novemberborn.net/javascript/event-cache
 */
function addEvent( obj, type, fn ) {
        if (obj.addEventListener) {
                obj.addEventListener( type, fn, false );
                EventCache.add(obj, type, fn);
        }
        else if (obj.attachEvent) {
                obj["e"+type+fn] = fn;
                obj[type+fn] = function() { obj["e"+type+fn]( window.event ); }
                obj.attachEvent( "on"+type, obj[type+fn] );
                EventCache.add(obj, type, fn);
        }
        else {
                obj["on"+type] = obj["e"+type+fn];
        }
}

/* unload all event handlers on page unload to avoid memory leaks */
var EventCache = function(){
        var listEvents = [];
        return {
                listEvents : listEvents,
                add : function(node, sEventName, fHandler){
                        listEvents.push(arguments);
                },
                flush : function(){
                        var i, item;
                        for(i = listEvents.length - 1; i >= 0; i = i - 1){
                                item = listEvents[i];
                                if(item[0].removeEventListener){
                                        item[0].removeEventListener(item[1], item[2], item[3]);
                                };
                                if(item[1].substring(0, 2) != "on"){
                                        item[1] = "on" + item[1];
                                };
                                if(item[0].detachEvent){
                                        item[0].detachEvent(item[1], item[2]);
                                };
                                item[0][item[1]] = null;
                        };
                }
        };
}();
addEvent(window,'unload',EventCache.flush);
// end of rock-solid addEvent

/**
 * Browser sniffing and document.ready code taken from jQuery.
 *
 * Source: jQuery (jquery.com) 
 * Copyright (c) 2008 John Resig (jquery.com)
 */
var userAgent = navigator.userAgent.toLowerCase();

// Figure out what browser is being used
gbs.browser = {
	version: (userAgent.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [])[1],
	safari: /webkit/.test( userAgent ),
	opera: /opera/.test( userAgent ),
	msie: /msie/.test( userAgent ) && !/opera/.test( userAgent ),
	mozilla: /mozilla/.test( userAgent ) && !/(compatible|webkit)/.test( userAgent )
};

function bindReady() {
	// Mozilla, Opera (see further below for it) and webkit nightlies currently support this event
	if ( document.addEventListener && !gbs.browser.opera)
		// Use the handy event callback
		document.addEventListener( "DOMContentLoaded", gbs.ready, false );
	
	// If IE is used and is not in a frame
	// Continually check to see if the document is ready
	if ( gbs.browser.msie && window == top ) (function(){
		if (gbs.isReady) return;
		try {
			// If IE is used, use the trick by Diego Perini
			// http://javascript.nwbox.com/IEContentLoaded/
			document.documentElement.doScroll("left");
		} catch( error ) {
			setTimeout( arguments.callee, 0 );
			return;
		}
		// and execute any waiting functions
		gbs.ready();
	})();

	if ( gbs.browser.opera )
		document.addEventListener( "DOMContentLoaded", function () {
			if (gbs.isReady) return;
			for (var i = 0; i < document.styleSheets.length; i++)
				if (document.styleSheets[i].disabled) {
					setTimeout( arguments.callee, 0 );
					return;
				}
			// and execute any waiting functions
			gbs.ready();
		}, false);

	if ( gbs.browser.safari ) {
		//var numStyles;
		(function(){
			if (gbs.isReady) return;
			if ( document.readyState != "loaded" && document.readyState != "complete" ) {
				setTimeout( arguments.callee, 0 );
				return;
			}
                        /*
			if ( numStyles === undefined )
				numStyles = jQuery("style, link[rel=stylesheet]").length;
			if ( document.styleSheets.length != numStyles ) {
				setTimeout( arguments.callee, 0 );
				return;
			}
                        */
			// and execute any waiting functions
			gbs.ready();
		})();
	}

	// A fallback to window.onload, that will always work
        addEvent(window, "load", gbs.ready);
}

// end of code taken from jQuery

gbs.ready = function () {
    if (gbs.isReady)
        return;
    gbs.isReady = true;

    for (var i = 0; i < gbs.readyListeners.length; i++) {
        gbs.readyListeners[i]();
    }
}

function trim(s) { 
    return s.replace(/^\s+|\s+$/g, ''); 
};

// find ISBN in III record display
function scrapeIdentifierInIIIRecordDisplay(id)
{
    var tds = document.getElementsByTagName("td");
    for (var i = 0; i < tds.length; i++) {
        if (tds[i].className != "bibInfoLabel")
            continue;
        var text = trim(tds[i].innerText || tds[i].textContent || "");
        if (!new RegExp(id).test(text))
            continue;

        var bdata = tds[i].nextSibling;
        while (bdata != null && bdata.tagName != "TD" && bdata.className != "bibInfoData")
            bdata = bdata.nextSibling;

        if (bdata == null)
            break;

        var text = trim(bdata.innerText || bdata.textContent || "");
        if (id == "ISBN") {
            var m = text.match(/^((\d|x){10,13}).*/i);
            if (m) {
                return "ISBN:" + m[1];
            }
        } else
        if (id == "OCLC") {
            return "OCLC:0000000";
        }
    }
    return null;
}

// Begin GBS code
var gbsKey2Req;         // map gbsKey -> Array<Request>
gbs.ProcessResults = function (bookInfo) {
    for (var i in bookInfo) {
        var result = bookInfo[i];
        // alert("result found for: " + result.bib_key + " " + result.preview);
        req = gbsKey2Req[result.bib_key];
        if (req == null || req == undefined) {
            continue;
        }

        for (var j = 0; j < req.length; j++) {
            req[j].onsuccess(result);
        }
        delete gbsKey2Req[result.bib_key];
    }

    for (var i in gbsKey2Req) {
        req = gbsKey2Req[i];
        if (req == null)
            continue;

        for (var j = 0; j < req.length; j++) {
            req[j].onfailure();
        }
        delete gbsKey2Req[i];
    }
}

// process all spans in a document
function gbsProcessSpans(spanElems) {
    gbsKey2Req = new Object();
    while (spanElems.length > 0) {
        var spanElem = spanElems.pop();
        if (spanElem.expanded)
            continue;

        gbsProcessSpan(spanElem);
    }

    var bibkeys = new Array();
    for (var k in gbsKey2Req)
        bibkeys.push(k);

    if (bibkeys.length == 0)
        return;

    bibkeys = bibkeys.join(",");
    var s = document.createElement("script");
    s.setAttribute("type", "text/javascript");
    // alert("searching for: " + bibkeys);
    s.setAttribute("src", "http://books.google.com/books?jscmd=viewapi&bibkeys=" + bibkeys + "&callback=gbs.ProcessResults");
    document.documentElement.firstChild.appendChild(s);
}

// process a single span
function gbsProcessSpan(spanElem) {
    var cName = spanElem.className;
    if (cName == null)
        return;

    var mReq = {
        span: spanElem, 
        removeTitle: function () {
            this.span.setAttribute('title', '');
        },
        success: new Array(),
        failure: new Array(),
        onsuccess: function (result) {
            for (var i = 0; i < this.success.length; i++)
                try {
                    this.success[i](this, result);
                } catch (er) { }
            this.removeTitle();
            if (!this.useConditionalVisible) 
                makeSureSpanIsVisible(this);
        },
        onfailure: function (status) {
            for (var i = 0; i < this.failure.length; i++)
                try {
                    this.failure[i](this, status);
                } catch (er) { }
            this.removeTitle();
        },
        /* get the search item that's sent to GBS
         * The search term may be in the title, or in the body.
         * It's in the body if the title contains a "*".
         * Example:  
         *           <span title="ISBN:0743226720"></span>
         *           <span title="*">ISBN:0743226720</span>
         *           <span title="ISBN:millennium.record"></span>
         *
         * 'ISBN:millennium.record' is a special case where we scrape
         * a III record display to find the ISBN.
         */
        getSearchItem: function () {
            if (this.searchitem != null)
                return this.searchitem;

            var req = this.span.getAttribute('title');
            if (req == "*" || req == "OCLC:*" || req == "LCCN:*") {
                var text = this.span.innerText || this.span.textContent || "";
                text = trim(text);
                this.searchitem = text;     // default

                switch (req) {
                case "*":
                    var m = text.match(/^((\d|x){10,13}).*/i);
                    if (m) {
                        this.searchitem = "ISBN:" + m[1];
                    }
                    break;

                case  "OCLC:*":
                    text = text.replace(/^[\s\S]*?(oc[mn])?(\d+)[\s\S]*/, "$2");
                    this.searchitem = "OCLC:" + text;
                    break;

                case  "LCCN:*":
                    this.searchitem = "LCCN:" + text;
                    break;
                }

                // remove first child only
                if (this.span.hasChildNodes())
                    this.span.removeChild(this.span.firstChild);
            } else if ((m = req.match(/(.*):millennium.record/)) != null) {
                this.searchitem = scrapeIdentifierInIIIRecordDisplay(m[1]);
            } else {
                this.searchitem = req.toLowerCase();
            }

            return this.searchitem;
        }
    };

    // wrap the span element in a link to bookinfo[bookInfoProp]
    function linkTo(mReq, bookInfoProp, target) {
        mReq.success.push(function (mReq, bookinfo) {
            if (bookinfo[bookInfoProp] === undefined)
                return;

            var p = mReq.span.parentNode;
            var s = mReq.span.nextSibling;
            p.removeChild(mReq.span);
            var a = document.createElement("a");
            a.setAttribute("href", bookinfo[bookInfoProp]);
            if (target != undefined)
                a.setAttribute("target", "_" + target);
            a.appendChild(mReq.span);
            p.insertBefore(a, s);
        });
    }

    function makeSureSpanIsVisible(mReq) {
        var node = mReq.span;
        if (node.style != null && node.style.display == "none") {
            node.style.display = "inline";
        }

        // and, if one or more hidden parents exist, unhide them parent as well.
        // XXX should we do this conditionally based on a gbs-unhide-parent class?
        for (; node != null; node = node.parentNode) {
            if (node.style != null && node.style.display == "none") {
                node.style.display = "block";
            }
        }
    }

    /**
     * See: http://code.google.com/apis/books/getting-started.html
        bib_key
            The identifier used to query this book.
        info_url
            A URL to a page within Google Book Search with information on the book (the about this book page)
        preview_url
            A URL to the preview of the book - this lands the user on the cover of the book. 
            If there only Snippet View or Metadata View books available for a request, no preview url 
            will be returned.
        thumbnail_url
            A URL to a thumbnail of the cover of the book.
        preview
            Viewability state - either "noview", "partial", or "full"
     */
    function addHandler(gbsClass, mReq) {

        var m = gbsClass.match(/gbs-link-to-(preview|info|thumbnail)(-(\S+))?/);
        if (m) {
            linkTo(mReq, m[1] + '_url', m[3]);
            return true;
        }

        switch (gbsClass) {
        case "gbs-thumbnail":
        case "gbs-thumbnail-large":
            mReq.success.push(function (mReq, bookinfo) {
                if ( bookinfo.thumbnail_url) {
                    var img = document.createElement("img");
                    var imgurl = bookinfo.thumbnail_url;
                    if (gbsClass == "gbs-thumbnail-large") {
                        imgurl = imgurl + '&zoom=1';
                    }
                    img.setAttribute("src", imgurl );
                    mReq.span.appendChild(img);
                }
            });
            break;

        case "gbs-embed-viewer":
            mReq.success.push(function (mReq, bookinfo) {
                if (!bookinfo.embeddable)
                    return;

                var viewer = new google.books.DefaultViewer(mReq.span);
                viewer.load(mReq.getSearchItem());
            });
            break;

        case "gbs-if-noview":
        case "gbs-if-partial-or-full":
        case "gbs-if-partial":
        case "gbs-if-full":
            mReq.gbsif = gbsClass.replace(/gbs-if-/, "");
            mReq.useConditionalVisible = true;
            mReq.success.push(function (mReq, bookinfo) {
                if (mReq.gbsif == "partial-or-full") {
                    var keep = bookinfo.preview == "partial" || bookinfo.preview == "full";
                } else {
                    var keep = bookinfo.preview == mReq.gbsif;
                }
                // remove if availability doesn't match the requested
                if (!keep) {
                    mReq.span.parentNode.removeChild(mReq.span);
                } else {
                    makeSureSpanIsVisible(mReq);
                }
            });
            break;

        case "gbs-remove-on-failure":
            mReq.failure.push(function (mReq, status) {
                mReq.span.parentNode.removeChild(mReq.span);
            });
            break;

        /* Use this to make backup elements disappear if GBS is successful */
        case "gbs-remove-on-success":
            mReq.success.push(function (mReq, status) {
               mReq.span.parentNode.removeChild(mReq.span);
            });
            break;

        // XXX add more here

        default:
            return false;
        }
        return true;
    }

    var isGBS = false;
    var classEntries = cName.split(/\s+/);
    mReq.useConditionalVisible = false;
    for (var i = 0; i < classEntries.length; i++) {
        if (addHandler(classEntries[i], mReq))
            isGBS = true;
    }

    if (!isGBS)
        return;

    var bibkey = mReq.getSearchItem();
    if (bibkey == null)
        return;

    if (gbsKey2Req[bibkey] === undefined) {
        gbsKey2Req[bibkey] = [ mReq ];
    } else {
        gbsKey2Req[bibkey].push(mReq);
    }
    mReq.span.expanded = true;
}

function gbsReady() {
    var span = document.getElementsByTagName("span");
    var spanElems = new Array();
    for (var i = 0; i < span.length; i++) {
        spanElems.push(span[span.length - 1 - i]);
    }
    var divs = document.getElementsByTagName("div");
    for (var i = 0; i < divs.length; i++) {
        spanElems.push(divs[divs.length - 1 - i]);
    }
    gbsProcessSpans(spanElems);
}

gbs.readyListeners.push(gbsReady);

bindReady();

if (typeof google != "undefined") {
    if (typeof google.load == "function") {
        google.load("books", "0");
    }
}

})();