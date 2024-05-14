<script lang="ts">
  import LoginSide from '../login-shared/LoginSide.svelte';
  import LoginForm from './LoginForm.svelte';
</script>

<LoginSide>
  <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[500px]">
    <div class="flex flex-col space-y-2">
      <h1 class="text-2xl font-semibold tracking-tight text-center">Login</h1>
      <p class="text-sm text-muted-foreground">Enter your secret (password) below to login.</p>
    </div>
    <LoginForm />
  </div>
</LoginSide>
