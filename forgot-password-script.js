document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.querySelector('#forgot-password-form');
    forgotPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.querySelector('#email').value;
        const errorElement = document.getElementById('forgot-password-error');
        errorElement.textContent = '';
        
        
        if (email === '') {
            errorElement.textContent = 'Please enter your email address';
        } else {
            const forgotPasswordData = { email: email };
            
            fetch('/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(forgotPasswordData)
            })
            .then(response => response.json())
            .then(data => {
                errorElement.textContent = data.message;
            })
            .catch(error => {
                errorElement.textContent = 'An error occurred. Please try again.';
                console.log(error);
            });
        }
    });

    const cancelButton = document.querySelector('#cancel-btn');
    cancelButton.addEventListener('click', function() {
        window.location.href = '/login';
    });
});