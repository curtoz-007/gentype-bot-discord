<?php
// Server-side code to verify the Turnstile token

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Extract the Turnstile token from the request
    $token = $_POST["g-recaptcha-response"];

    // Your secret key for Turnstile
    $secret = "0x4AAAAAAASusopK1WNXlM7qbK-Zj7sQT6s";

    // Verify the Turnstile token
    $response = file_get_contents("https://challenges.cloudflare.com/turnstile/v0/siteverify", false, stream_context_create([
        "http" => [
            "method" => "POST",
            "header" => "Content-Type: application/x-www-form-urlencoded\r\n",
            "content" => http_build_query([
                "secret" => $secret,
                "token" => $token,
            ]),
        ],
    ]));

    // Decode the response
    $responseData = json_decode($response);

    // Check if the verification was successful
    if ($responseData->success) {
        // Verification successful, proceed with form submission
        // You can perform additional validation here if needed
        // Assuming form data is valid, redirect or process the data as required
        
        // For demonstration, we're redirecting to the specified URL after successful verification
        header("Location: https://verify.chonkgen.com:30009/addUser");
        exit();
    } else {
        // Verification failed, handle the error
        echo "Verification failed!";
    }
} else {
    // Invalid request method
    echo "Invalid request method!";
}
?>
