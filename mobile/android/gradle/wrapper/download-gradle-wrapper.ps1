$gradleVersion = "8.0.1"
$wrapperUrl = "https://raw.githubusercontent.com/gradle/gradle/v$gradleVersion/gradle/wrapper/gradle-wrapper.jar"
$outputPath = "gradle-wrapper.jar"

Invoke-WebRequest -Uri $wrapperUrl -OutFile $outputPath
Write-Host "Downloaded gradle-wrapper.jar"
