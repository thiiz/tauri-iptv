use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct XtreamConfig {
    pub url: String,
    pub username: String,
    pub password: String,
    pub preferred_format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

#[tauri::command]
async fn iptv_request(
    url: String,
    params: std::collections::HashMap<String, String>,
) -> Result<ApiResponse<serde_json::Value>, String> {
    let client = reqwest::Client::new();
    
    let mut request_url = url::Url::parse(&url).map_err(|e| format!("Invalid URL: {}", e))?;
    
    // Add query parameters
    for (key, value) in params {
        request_url.query_pairs_mut().append_pair(&key, &value);
    }
    
    match client.get(request_url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.text().await {
                    Ok(text) => {
                        match serde_json::from_str::<serde_json::Value>(&text) {
                            Ok(data) => Ok(ApiResponse {
                                success: true,
                                data: Some(data),
                                error: None,
                            }),
                            Err(e) => Ok(ApiResponse {
                                success: false,
                                data: None,
                                error: Some(format!("Failed to parse JSON: {}", e)),
                            }),
                        }
                    }
                    Err(e) => Ok(ApiResponse {
                        success: false,
                        data: None,
                        error: Some(format!("Failed to read response: {}", e)),
                    }),
                }
            } else {
                Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some(format!("HTTP error: {}", response.status())),
                })
            }
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("Request failed: {}", e)),
        }),
    }
}

#[tauri::command]
async fn test_iptv_connection(
    config: XtreamConfig,
) -> Result<ApiResponse<serde_json::Value>, String> {
    let mut params = std::collections::HashMap::new();
    params.insert("username".to_string(), config.username);
    params.insert("password".to_string(), config.password);
    params.insert("action".to_string(), "get_profile".to_string());
    
    // Ensure URL ends with player_api.php
    let mut api_url = config.url;
    if !api_url.ends_with("/player_api.php") {
        api_url = api_url.trim_end_matches('/').to_string() + "/player_api.php";
    }
    
    iptv_request(api_url, params).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![
        iptv_request,
        test_iptv_connection
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
