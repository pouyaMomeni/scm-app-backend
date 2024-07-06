const form = document.getElementById('form')
const formListener = document.getElementById('form-listener')
const password = document.getElementById('password-first')
const passwordSec = document.getElementById('password-sec')
const messageTag = document.getElementById('message')
const notMessage = document.getElementById('notification-message')
const submitButton = document.getElementById('submit')
const myPasswordRegX = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;

form.style.display = "none";
let token,id;
window.addEventListener("DOMContentLoaded", async ()=>{
    const param = new Proxy(new URLSearchParams(window.location.search),{
        get : (serchParams,prop) => {
           return serchParams.get(prop)
        }
    })

    token = param.token;
    id = param.id;
    const res = await fetch('auth/verify-pass-reset-token',{
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
    messageTag.style.display = "none";
    form.style.display = "block";
})

const displayNotification = (message) => {
    notMessage.style.display = "block";
    notMessage.innerText = message;
    notMessage.classList.add(type);
}

const handelSubmit = async (evnt) => {
    evnt.preventDefault();

    // validate
    if(!myPasswordRegX.test(password.value)){
        return displayNotification("Invalid password","error")
    } 
    //compare password that is the same or not
    if(password.value !== passwordSec.value){
        return displayNotification("Password do not match","error")
    } 
    submitButton.disable = true;
    submitButton.innerText = "please w8";
    const res = await fetch('auth/reset-password',{
        method : 'POST',
        headers :{
            "Content-Type" : "application/json;charset=utf-8"
        },
        body : JSON.stringify({id,token,password : password.value})
    });
    submitButton.disable = false;
    submitButton.innerText = "rest password";

    if(!res.ok){
        const {message} = await res.json()
        displayNotification(message,'error')
    }
    messageTag.style.display = "block";
    messageTag.innerText = "Your password has beed updated"
    form.style.display = 'none';
}

formListener.addEventListener('submit',handelSubmit)