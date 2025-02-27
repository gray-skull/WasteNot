document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.querySelector('#forgot-password-form');
    const forgotPasswordPrompt = document.querySelector('#reset-password-prompt');
    forgotPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        forgotPasswordForm.style.display = 'flex';
        forgotPasswordPrompt.style.display = 'block';
        
        const email = document.querySelector('#email').value;
        const errorElement = document.getElementById('forgot-password-error');
        errorElement.textContent = '';
        
        
        if (email === '') {
            errorElement.textContent = 'Please enter your email address';
            errorElement.style.display = 'block';
        } else {
            const forgotPasswordData = { email: email };
            
            fetch('/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(forgotPasswordData)
            })
            .then(response => response.json())
            .then(data => {
                errorElement.textContent = data.message || data.error || 'An error occurred. Please try again.';
                errorElement.style.color = data.success ? 'green' : 'red';
                errorElement.style.display = 'block';
                if (data.success) {
                    forgotPasswordForm.reset();
                    // hide the form
                    forgotPasswordForm.style.display = 'none';
                    forgotPasswordPrompt.style.display = 'none';
                }
            })
            .catch(error => {
                errorElement.textContent = 'An error occurred. Please try again.';
                errorElement.style.display = 'block';
                console.log(error);
            });
        }
    });

    const cancelButton = document.querySelector('#cancel-btn');
    cancelButton.addEventListener('click', function() {
        window.location.href = '/login';
    });
});