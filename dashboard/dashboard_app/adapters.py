from allauth.account.adapter import DefaultAccountAdapter

class CustomAccountAdapter(DefaultAccountAdapter):
    def save_user(self, request, user, form, commit=True):
        """
        Custom method to save user attributes from the form data.
        """
        data = form.cleaned_data

        # setting user attributes
        user.email = data.get('email')
        
        # get username from form data or generate a random one
        if not data.get('username'):
            from django.utils.crypto import get_random_string
            user.username = get_random_string(10)
            
        # save user attributes
        if commit:
            user.save()
            
        return user