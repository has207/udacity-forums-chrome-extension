(function() {
    var currentURL;

    // javascript sucks for not having array.index()
    var getUnitNumber = function(items, active) {
      for (var i=0; i<items.length; i++) {
        if (items[i] === active) {
          return i + 1;
        }
      }
    };

    var getCourseId = function() {
      if (!document.location.hash) return;
      var matches = document.location.hash.match(/[^/]*/g);
      if (matches && matches.length > 2) return matches[2];
    };

    // figure out if we're dealing with a "unit" or "problem set"
    var getUnitType = function(node) {
      var name, match;
      var nameNodes = node.parentNode.getElementsByClassName('unit-name');
      if (!nameNodes.length) return;
      var nameNode = nameNodes[0];
      match = nameNode.innerHTML.match(/Unit [0-9]*/);
      if (match && match.length) {
        name = match[0].replace('Unit ', 'unit');
      } else {
        match = nameNode.innerHTML.match(/Problem Set [0-9]*/);
        if (match && match.length) {
          name = match[0].replace('Problem Set ', 'ps');
        } else {
          // Exam questions tend not to get tagged as consistently as
          // other units, with "exam", "final_exam", "final" as well as
          // "ps7-X" all being likely tags. We go with ps7-X as it
          // lets us actually choose posts for the given problem
          match = nameNode.innerHTML.match(/Exam/);
          if (match && match.length) {
            name = "ps7";
          }
        }
      }
      return name;
    };

    var getForumURL = function(active) {
      var parent = active.parentNode;
      var items = parent.getElementsByTagName('li');
      if (!items.length) return;
      var course = getCourseId();
      var num = getUnitNumber(items, active);
      var type = getUnitType(parent);
      return 'http://forums.udacity.com/' + course + '/tags/' + type + '-' + num + '/';
    };

    var updateLinks = function(div) {
      var links = div.getElementsByTagName('a');
      for (var i=0; i< links.length; i++) {
        var a = links[i];
        if (a.getAttribute('href').search(/https?:\/\/forums\.udacity\.com/) != 0) {
          a.setAttribute('href', 'http://forums.udacity.com' + a.getAttribute('href'));
        }
        // force the links to open a new tab
        a.setAttribute('target', '_blank');
      }
    }

    var onForumResponse = function() {
      // for some reason onreadystatechange runs multiple times
      // we check if the DOM is already updated and return in case this happens
      var div = document.getElementById('comments-list');
      if (div) return;

      // create a temp div element for the response HTML in order to
      // efficiently parse out the relevant pieces of the forums page
      var temp = document.createElement('div');
      temp.innerHTML = this.responseText;
      var posts = temp.getElementsByClassName('short-summary');
      if (posts.length) {
        var div = document.createElement('div');
        div.id = 'comments-list';
        while (posts.length) div.appendChild(posts[0]);
        var content = document.getElementById('content');
        if (!content) return;
        updateLinks(div);
        content.appendChild(div);
      }
    };

    // wait until the page has loaded enough to show currently active unit
    var id_ = setInterval(function() {
      var active = document.getElementsByClassName('active');
      if (!active.length) return;

      var url = getForumURL(active[0]);
      if (!currentURL || currentURL != url) {
        currentURL = url;
        var comments = document.getElementById('comments-list');
        if (comments) comments.parentNode.removeChild(comments);
        var xhr = new XMLHttpRequest();
        xhr.open('GET', currentURL, true);
        xhr.onreadystatechange = onForumResponse;
        xhr.send();
      }
    }, 2000);
})();
