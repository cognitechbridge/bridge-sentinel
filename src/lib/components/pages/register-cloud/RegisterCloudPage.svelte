<script>
  import LoginSide from '../login-shared/LoginSide.svelte';
  import UserRegisterForm from './UserRegisterCloudForm.svelte';
</script>

<LoginSide>
  <div class="lg:p-8">
    <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div class="flex flex-col space-y-2">
        <h1 class="text-2xl font-semibold tracking-tight text-center">First Setup</h1>
        <p class="text-sm text-muted-foreground">
          Enter your secret below to setup the application. The secret should be different from the
          password you use to login to CTB Cloud.
        </p>
      </div>
      <UserRegisterForm />
      <p class="px-8 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  </div>
</LoginSide>
