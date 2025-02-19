document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.querySelector('#forgot-password-form');
    forgotPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
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