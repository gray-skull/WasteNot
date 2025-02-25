document.addEventListener('DOMContentLoaded', function () {
    const errorElement = document.getElementById('reset-password-error');
    errorElement.textContent = '';
    errorElement.style.display = 'none';

    document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.querySelector('#newPassword').value;
        const confirmPassword = document.querySelector('#confirmNewPassword').value;
        const token = window.location.pathname.split('/').pop();

        const errors = [
            { condition: newPassword === '' || confirmPassword === '', message: "Please enter and confirm your new password." },
            { condition: newPassword !== confirmPassword, message: "Password and confirm password do not match." },
            { condition: newPassword.length < 6, message: "Password must be at least 6 characters long." },
            { condition: newPassword.length > 20, message: "Password must be at most 20 characters long." },
            { condition: !/^[\x20-\x7E]*$/.test(newPassword), message: "Password can only contain letters, numbers, and common symbols. Allowed symbols: !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~" },
        ];
        
        for (const error of errors) {
            if (error.condition) {
                errorElement.textContent = error.message;
                return;
            }
        }

        try {
            const response = await fetch(`/reset-password/${token}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ newPassword })
            });

            if (!response.ok) {
                const errorData = await response.json();
                errorElement.textContent = errorData.message;
                errorElement.style.display = 'block';
            } else {
                alert('Password reset successfully');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error:', error);
            errorElement.textContent = 'An error occurred. Please try again later';
            errorElement.style.display = 'block';
        } 

           
    });
});