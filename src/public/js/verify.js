const messageTag = document.getElementById('message')

window.addEventListener("DOMContentLoaded", async ()=>{
    const param = new Proxy(new URLSearchParams(window.location.search),{
        get : (serchParams,prop) => {
           return serchParams.get(prop)
        }
    })

    const token = param.token;
    const id = param.id;
    const res = await fetch('auth/verify',{
        method : 'POST',
        body : JSON.stringify({token,id}),
        headers :{
            "Content-Type" : "application/json;charset=utf-8"
        }
    });
    if (!res.ok) {
        const {message} = await res.json();
        messageTag.innerText = message;
        messageTag.classList.add('error');
        return
    }
    const {message} = await res.json();
    messageTag.innerText = message;
})