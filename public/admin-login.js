const toggle=document.querySelector('[data-password-toggle]');
const password=document.querySelector('#admin-password');
toggle?.addEventListener('click',()=>{
  const show=password.type==='password';
  password.type=show?'text':'password';
  toggle.setAttribute('aria-label',show?'Hide password':'Show password');
  toggle.setAttribute('aria-pressed',String(show));
  toggle.querySelector('span').className=show?'fa-regular fa-eye-slash':'fa-regular fa-eye';
});
document.querySelector('#admin-login-form')?.addEventListener('submit',event=>{
  const button=event.currentTarget.querySelector('[type=submit]');
  button.disabled=true;button.querySelector('span').textContent='Signing in...';
});
