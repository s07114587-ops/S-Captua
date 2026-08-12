!function(){"use strict";
var e=document.createElement("style");
function t(){
    var e=document.querySelector("form")||document.querySelector("header")||document.querySelector(".dev-header");
    var t=document.createElement("div");
    t.className="scaptcha-modal-overlay";
    t.innerHTML='<div class="scaptcha"><div class="scaptcha-body"><label class="sc-hp" style="display:none;"><input type="text" class="scHoneypot"></label><div class="sc-box" role="checkbox"><div class="sc-spinner"></div><svg viewBox="0 0 24 24"><path d="M4 12l6 6L20 6"/></svg></div><div class="sc-label"><div class="sc-label-text">Verify Humanity</div><div class="sc-sub">Click to verify</div></div></div></div>';
    document.body.appendChild(t);
    
    var c=t.querySelector(".sc-box"),r=t.querySelector(".sc-sub"),i=t.querySelector(".scHoneypot"),lastClick=0,clickCount=0;

    function ban(){window.location.href="https://www.scaptua.duckdns.org/to-dear-bot-or-hacker.html"}
    
    // গেম ফাংশন
    function startGame(){
        var gameOverlay=document.createElement("div");
        gameOverlay.className="sc-game-overlay";
        gameOverlay.innerHTML='<div class="sc-game-box"><h3>Catch the Ball! ⚽</h3><p>Click the ball 3 times to verify</p><div id="sc-ball"></div></div>';
        document.body.appendChild(gameOverlay);
        var ball=gameOverlay.querySelector("#sc-ball"),hit=0;
        ball.onclick=function(){
            hit++;
            if(hit>=3){gameOverlay.remove();c.classList.add("checked");r.textContent="Verified Human!";}
            else{ball.style.left=Math.random()*200+"px";ball.style.top=Math.random()*200+"px";}
        };
    }

    c.addEventListener("click",function(e){
        if(i.value!=="") ban();
        var now=Date.now();
        if(now-lastClick < 300) clickCount++; else clickCount=0;
        lastClick=now;
        
        if(clickCount>2) { startGame(); }
        else {
            c.classList.add("loading");
            setTimeout(function(){ c.classList.remove("loading"); c.classList.add("checked"); r.textContent="Verified"; }, 1000);
        }
    });
}
e.innerHTML=".scaptcha-modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:9999}.scaptcha{width:300px;background:white;padding:20px;border-radius:10px;}.sc-box{width:40px;height:40px;border:2px solid #ccc;cursor:pointer}.sc-game-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:black;z-index:99999;display:flex;justify-content:center;align-items:center}.sc-game-box{background:white;padding:30px;position:relative;width:300px;height:300px}#sc-ball{width:50px;height:50px;background:red;border-radius:50%;position:absolute;cursor:pointer;transition:0.1s}";
document.head.appendChild(e); t();
}();
