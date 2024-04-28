<script>
  import UserRegisterForm from './UserRegisterForm.svelte';
</script>

<div
  class="container relative h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0"
>
  <div class="relative h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
    <div
      class="absolute inset-0 bg-cover"
      style="
				background-image:
					url(https://images.unsplash.com/photo-1590069261209-f8e9b8642343?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1376&q=80);"
    />
    <div class="relative z-20 flex items-center text-lg font-medium">
      <!-- <Command class="mr-2 h-6 w-6" /> -->
      Cognitech Bridge AI
    </div>
    <div class="relative z-20 mt-auto">
      <blockquote class="space-y-2">
        <p class="text-lg">
          &ldquo;Security and privacy in the medical field are not just about protecting data, but
          about safeguarding the very essence of human dignity and trust in healthcare.&rdquo;
        </p>
        <footer class="text-sm">Chat GPT</footer>
      </blockquote>
    </div>
  </div>
  <div class="lg:p-8">
    <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div class="flex flex-col space-y-2">
        <h1 class="text-2xl font-semibold tracking-tight text-center">First Setup</h1>
        <p class="text-sm text-muted-foreground">
          Enter your email and secret (password) below to setup the application.
        </p>
      </div>
      <UserRegisterForm />
      <p class="px-8 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  </div>
</div>
