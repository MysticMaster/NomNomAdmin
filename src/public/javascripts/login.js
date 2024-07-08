const form = document.querySelector('form');
const usernameErr = document.getElementById('username-err');
const passwordErr = document.getElementById('password-err');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    usernameErr.textContent = "";
    passwordErr.textContent = "";

    const username = form.username.value;
    const password = form.password.value;

    try {
        const response = await axios.post('/login', {
            username: username,
            password: password
        });

        if(response.data.errors){
            usernameErr.textContent = response.data.errors.username;
            passwordErr.textContent = response.data.errors.password;
        }

        if(response.data.member){
            location.assign('/')
        }
    } catch (error) {
        console.log('err:',error);
    }
});