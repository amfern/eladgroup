// Include basic Dojo, mobile, XHR dependencies along with
define(["dojo/_base/declare",
        "dojo/_base/array", 
        "dojo/_base/lang", 
        "dojo/i18n", 
        "dojo/dom-class",
        "dojo/dom-attr", 
        "dojox/mobile/ScrollableView", 
        "dojox/mobile/ListItem", 
        "dojo/DeferredList",        
        "elad/_ViewMixin", 
        "dijit/registry",
        "dijit/Dialog",
        "dojo/request/script"],
    function(declare, arrayUtil, lang, i18n, domClass, domAttr, ScrollableView, ListItem, DeferredList, _ViewMixin, registry, Dialog, script) {
        // Return the declared class!
        return declare("elad.WhoisHereView", [ScrollableView, _ViewMixin], {
           // ovveride function to load more when reached the bottom 
           adjustDestination: function(to, pos){ 
            var dim = this.getDim(); 
            var ch = dim.c.h; // content area height 
            var dh = dim.d.h; // displaying area height 
            if(to.y < dh - ch){ // check if scrolling down to the end 
              this.refresh(); // refresh
            } 
          },
          
          // URL to pull tweets from; simple template included
          serviceUrl: "http://search.twitter.com/search.json?q=${searchString}&page=${page}",
          
          // Create a template string for tweets:
          tweetTemplateString: '<img src="${avatar}" alt="${name}" class="tweetviewAvatar" />' +
                               '<div class="time" data-dojo-time="${created_at}">${time}</div>' +
                               '<div class="tweetviewContent"> ' +
                                '<div class="content tweetviewUser">${user}</div>' +
                                '<div class="content tweetviewText">${text}</div>' +
                               '</div>' + 
                               '<div class="tweetviewClear"></div>',
          
          // Icon for loading...
          iconLoading: require.toUrl("assets/ajax-loader.gif"),
          
          // When the widgets have started....
          startup: function() {
            // Retain functionality of startup in dojox/mobile/ScrollableView
            this.inherited(arguments);
            
            // Get the list widget
            this.listNode = this.getListNode();
            this.showListNode(false);
            this.page = 1;
            
            // Every 60 seconds, update the times
            // setInterval(lang.hitch(this, function() {
              // arrayUtil.forEach(this.getElements("time", this.domNode), function() {
                // timeNode.innerHTML = this.formatTime(domAttr.get(timeNode, "data-dojo-time"));
              // }, this);
            // }), 60000);            
            this.refresh();
          },
          
          // Contacts twitter to receive tweets
          refresh: function() {
            var loadingDialog = new Dialog();
            loadingDialog.set('content', '<img src="assets/ajax-loader.gif">');
            loadingDialog.show(); 
            
            script.get(this.substitute(this.serviceUrl, { searchString: 'newyear', page: this.page}), {
              jsonp: "callback",
              preventCache: true,
              timeout: 3000,
            }).then(function(data){
              loadingDialog.hide();
              this.page++;  
              this.updateTweets(data.results);
            }.bind(this), 
            function(err){
              loadingDialog.hide();
            });
          },
          
          // Adds the proper tweet linkification to a string
          formatTweet: function(tweetText) {
            return tweetText.
            replace(/(https?:\/\/\S+)/gi,'<a href="$1">$1</a>').
            replace(/(^|\s)@(\w+)/g,'$1<a href="http://twitter.com/$2">@$2</a>').
            replace(/(^|\s)#(\w+)/g,'$1<a href="http://search.twitter.com/search?q=%23$2">#$2</a>');
          },
          
          // Formats the time as received by Twitter
          formatTime: function(date) {
            var time = new Date(date);
            
            return (time.getHours().toString().length == 1 ? '0' : '') + time.getHours() + 
                   ':' + 
                   (time.getMinutes().toString().length == 1 ? '0' : '') + time.getMinutes();
          },
          
          updateTweets: function(tweets) {
            if(!tweets.length)
              return;
              
            arrayUtil.forEach(tweets, function(tweet) {
              // Create a new list item, inject into list
              var item = new ListItem({'class': 'personItem'}).placeAt(this.listNode, 'last');
                     
              // Update the list item's content using our template for tweets
              item.containerNode.innerHTML = this.substitute(this.tweetTemplateString, {
                text: this.formatTweet(tweet.text),
                user: tweet.from_user || screenName,
                name: tweet.from_user || tweet.user.name,
                avatar: tweet.profile_image_url || tweet.user.profile_image_url,
                time: this.formatTime(tweet.created_at),
                created_at: tweet.created_at,
                id: tweet.id
              })
            }, this);
            
            this.showListNode(true);
          },
 
        });
    }
);