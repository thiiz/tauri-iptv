use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct XtreamConfig {
    pub url: String,
    pub username: String,
    pub password: String,
    #[serde(rename = "preferredFormat")]
    pub preferred_format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProfileAccount {
    pub id: String,
    pub name: String,
    pub config: XtreamConfig,
    #[serde(rename = "isActive")]
    pub is_active: bool,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "lastUsed")]
    pub last_used: Option<String>,
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

#[tauri::command]
async fn save_profile_account(
    app_handle: tauri::AppHandle,
    profile: ProfileAccount,
) -> Result<ApiResponse<()>, String> {
    use tauri_plugin_store::StoreExt;
    
    let store = match app_handle.store_builder("profiles.json").build() {
        Ok(store) => store,
        Err(e) => return Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("Failed to create store: {}", e)),
        }),
    };
    
    // Get existing profiles
    let mut profiles: Vec<ProfileAccount> = store
        .get("profiles")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    
    // Update or add profile
    if let Some(existing) = profiles.iter_mut().find(|p| p.id == profile.id) {
        *existing = profile;
    } else {
        profiles.push(profile);
    }
    
    // Save back to store
    store.set("profiles", serde_json::to_value(&profiles).unwrap());
    
    if let Err(e) = store.save() {
        return Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("Failed to save store: {}", e)),
        });
    }
    
    Ok(ApiResponse {
        success: true,
        data: Some(()),
        error: None,
    })
}

#[tauri::command]
async fn get_profile_accounts(
    app_handle: tauri::AppHandle,
) -> Result<ApiResponse<Vec<ProfileAccount>>, String> {
    use tauri_plugin_store::StoreExt;
    
    let store = match app_handle.store_builder("profiles.json").build() {
        Ok(store) => store,
        Err(e) => return Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("Failed to create store: {}", e)),
        }),
    };
    
    let profiles: Vec<ProfileAccount> = store
        .get("profiles")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    
    Ok(ApiResponse {
        success: true,
        data: Some(profiles),
        error: None,
    })
}

#[tauri::command]
async fn delete_profile_account(
    app_handle: tauri::AppHandle,
    profile_id: String,
) -> Result<ApiResponse<()>, String> {
    use tauri_plugin_store::StoreExt;
    
    let store = match app_handle.store_builder("profiles.json").build() {
        Ok(store) => store,
        Err(e) => return Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("Failed to create store: {}", e)),
        }),
    };
    
    let mut profiles: Vec<ProfileAccount> = store
        .get("profiles")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    
    profiles.retain(|p| p.id != profile_id);
    
    store.set("profiles", serde_json::to_value(&profiles).unwrap());
    
    if let Err(e) = store.save() {
        return Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("Failed to save store: {}", e)),
        });
    }
    
    Ok(ApiResponse {
        success: true,
        data: Some(()),
        error: None,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![
        iptv_request,
        test_iptv_connection,
        save_profile_account,
        get_profile_accounts,
        delete_profile_account
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
