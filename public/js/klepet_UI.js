function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}


function jeSlika(sporocilo){
  sporocilo = sporocilo.replace(new RegExp('\\b'+'\(https://|http://)(.*?).(jpg|png|gif)'+'\\b', 'gi'), "<img id = \"dodanaSlika\" src=\""+sporocilo+"\">");
  return sporocilo;
}


function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  var procesirano1 = jeSlika(sporocilo);
  //var procesirano2 = jeVideo(sporocilo);
   var sistemskoSporocilo;

function jeVideo(sporocilo){
  console.log("Deljeno = " + sporocilo.split('='));
  var delitev = sporocilo.split('=')
  sporocilo = sporocilo.replace(new RegExp('\(https://www.youtube.com/watch?\\?v)(.*)[^\s]*\\b','gi'), "<div id = \"dodanVideo\"><iframe src=\"https://www.youtube.com/embed/" + delitev[1]+ "\" allowfullscreen></iframe><div>");
  return sporocilo;
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;
  var procesirano2 = jeVideo(sporocilo);


  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));

    if(procesirano1 != sporocilo){
      $('#sporocila').append(procesirano1);
    }
    /*if(procesirano2 != sporocilo){
      $('#sporocila').append(procesirano2);
    }*/

    if(procesirano2 != sporocilo){
      $('#sporocila').append(procesirano2);
    }

    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);
  
  socket.on('dregljaj', function(dregljaj) {
    
      $('#vsebina').jrumble().trigger('startRumble');
      setTimeout(function(){
        $('#vsebina').jrumble().trigger('stopRumble');
      }, 1500);
      
  });

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
    var procesirano1 = sporocilo.besedilo;
    procesirano1 = procesirano1.replace(new RegExp('\\b(.*?): \\b', 'gi'), '');

    var procesirano11 = jeSlika(procesirano1);
    //var procesirano22 = jeVideo(procesirano1);
    if(procesirano1 != procesirano11){
      $('#sporocila').append(procesirano11);
    }
    /*if(procesirano1 != procesirano22){
       $('#sporocila').append(procesirano22);
    }*/

    var procesirano22 = jeVideo(procesirano1);
    if(procesirano1 != procesirano22){
       $('#sporocila').append(procesirano22);
    }

    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function() {
      $('#poslji-sporocilo').val("/zasebno \""+ $(this).text()+"\" ");
      $('#poslji-sporocilo').focus();
    });
    
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}
