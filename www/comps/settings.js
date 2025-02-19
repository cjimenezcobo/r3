import {set as setSetting} from './shared/settings.js';
import {
	aesGcmDecryptBase64,
	aesGcmDecryptBase64WithPhrase,
	aesGcmEncryptBase64,
	aesGcmEncryptBase64WithPhrase,
	aesGcmExportBase64,
	aesGcmImportBase64,
	pbkdf2PassToAesGcmKey,
	pemExport,
	pemImport,
	rsaGenerateKeys
} from './shared/crypto.js';
export {MySettings as default};

let MySettingsEncryption = {
	name:'my-settings-encryption',
	template:`<div class="encryption">
	
		<p>{{ capApp.description }}</p>
		
		<table>
			<tr>
				<td class="minimum">{{ capGen.status }}:</td>
				<td><b>{{ statusCaption }}</b></td>
			</tr>
		</table>
		<br />
		
		<!-- list of modules with encryption enabled -->
		<template v-if="anyEnc && !locked">
			<h2>{{ capApp.modulesEnc }}</h2>
			<ul>
				<li v-for="mei in moduleEntriesIndexesEnc">
					{{ moduleEntries[mei].caption }}
				</li>
			</ul>
		</template>
		
		<!-- create new key pair -->
		<template v-if="loginKeyAes !== null && !loginEncryption">
			<my-button
				v-if="!newKeys"
				@trigger="createKeys"
				:active="!running"
				:caption="capApp.button.createKeys"
				:image="!running ? 'add.png' : 'load.gif'"
			/>
			
			<!-- newly created keys ready for storage -->
			<template v-if="newKeys">
				<h2>{{ capApp.newKeys }}</h2>
				<p>{{ capApp.newKeysDesc }}</p>
				
				<h2>{{ capApp.backupCode }}</h2>
				<div class="backup-code shade">{{ newBackupCode }}</div>
				<p v-html="capApp.backupCodeDesc"></p>
				
				<table>
					<tr>
						<td><my-bool v-model="confirmBackupCode" /></td>
						<td>{{ capApp.confirmBackupCode }}</td>
					</tr>
					<tr>
						<td><my-bool v-model="confirmEncryption" /></td>
						<td>{{ capApp.confirmEncryption }}</td>
					</tr>
				</table>
				<br />
				<br />
				
				<my-button image="key.png"
					@trigger="set"
					:active="!running && confirmBackupCode && confirmEncryption"
					:caption="capApp.button.storeKeys"
				/>
			</template>
		</template>
		
		<!-- recover access -->
		<template v-if="locked">
			<h2>{{ capApp.regainAccess }}</h2>
			<p>{{ capApp.regainAccessDesc }}</p>
			
			<table class="default-inputs">
				<tr>
					<td>{{ capApp.prevPassword }}</td>
					<td><input v-model="regainPassword" /></td>
					<td>
						<my-button image="key.png"
							@trigger="unlockWithPassphrase"
							:active="regainPassword !== ''"
							:caption="capGen.button.unlock"
						/>
					</td>
				</tr>
				<tr>
					<td>{{ capApp.backupCode }}</td>
					<td><textarea v-model="regainBackupCode"></textarea></td>
					<td>
						<my-button image="key.png"
							@trigger="unlockWithBackupCode"
							:active="regainBackupCode !== ''"
							:caption="capGen.button.unlock"
						/>
					</td>
				</tr>
			</table>
		</template>
		
		<!-- reset access -->
		<template v-if="locked">
			<br />
			<h2>{{ capApp.resetAccess }}</h2>
			<p v-html="capApp.resetAccessDesc"></p>
			
			<my-button image="warning.png"
				@trigger="resetAsk"
				:cancel="true"
				:caption="capGen.button.reset"
			/>
		</template>
	</div>`,
	props:{
		moduleEntries:{ type:Array, required:true }
	},
	data:function() {
		return {
			running:false,
			
			// user confirmations for enabling encryption
			confirmBackupCode:false,
			confirmEncryption:false,
			
			// newly created keys to be stored
			newBackupCode:null,
			newKeyPair:null,
			newKeyPrivateEnc:null,
			newKeyPrivateEncBackup:null,
			
			// regain access
			regainBackupCode:'',
			regainPassword:''
		};
	},
	computed:{
		// indexes of module entries with any relation with enabled encryption
		moduleEntriesIndexesEnc:function() {
			let out = [];
			for(let i = 0, j = this.moduleEntries.length; i < j; i++) {
				for(const r of this.moduleIdMap[this.moduleEntries[i].id].relations) {
					if(r.encryption) {
						out.push(i);
						break;
					}
				}
			}
			return out;
		},
		
		// e2e encryption status
		statusCaption:function() {
			if(!this.active) return this.capApp.status.inactive;
			if(this.locked)  return this.capApp.status.locked;
			return this.capApp.status.unlocked;
		},
		
		// states
		active: function() { return this.loginEncryption; },
		anyEnc: function() { return this.moduleEntriesIndexesEnc.length !== 0; },
		locked: function() { return this.active && this.loginPrivateKey === null; },
		newKeys:function() { return this.newKeyPrivateEnc !== null; },
		
		// stores
		moduleIdMap:       function() { return this.$store.getters['schema/moduleIdMap']; },
		loginKeyAes:       function() { return this.$store.getters['local/loginKeyAes']; },
		loginKeySalt:      function() { return this.$store.getters['local/loginKeySalt']; },
		loginEncryption:   function() { return this.$store.getters.loginEncryption; },
		loginPrivateKey:   function() { return this.$store.getters.loginPrivateKey; },
		loginPrivateKeyEnc:function() { return this.$store.getters.loginPrivateKeyEnc; },
		loginPrivateKeyEncBackup:function() { return this.$store.getters.loginPrivateKeyEncBackup; },
		loginPublicKey:    function() { return this.$store.getters.loginPublicKey; },
		kdfIterations:     function() { return this.$store.getters.constants.kdfIterations; },
		capApp:            function() { return this.$store.getters.captions.settings.encryption; },
		capErr:            function() { return this.$store.getters.captions.error; },
		capGen:            function() { return this.$store.getters.captions.generic; }
	},
	methods:{
		// externals
		aesGcmDecryptBase64,
		aesGcmDecryptBase64WithPhrase,
		aesGcmEncryptBase64,
		aesGcmEncryptBase64WithPhrase,
		aesGcmImportBase64,
		pbkdf2PassToAesGcmKey,
		pemExport,
		pemImport,
		rsaGenerateKeys,
		
		generateBackupCode:function() {
			let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
			let len   = 128;
			let arr   = new Uint32Array(len);
			let out   = '';
			crypto.getRandomValues(arr);
			for(let i = 0; i < len; i++) {
				out += chars[arr[i] % chars.length];
			}
			return out;
		},
		createKeys:function() {
			this.running = true;
			const backupCode     = this.generateBackupCode();
			const backupCodeShow = backupCode.replace(/.{4}/g, '$& '); // add spaces every 4 chars
			
			// generate RSA key pair for user
			// import login AES key for encryption of private key
			Promise.all([
				this.rsaGenerateKeys(true,4096),
				this.aesGcmImportBase64(this.loginKeyAes)
			]).then(
				res => {
					const keyPair  = res[0];
					const keyLogin = res[1];
					
					// export both keys as PEM
					Promise.all([
						this.pemExport(keyPair.privateKey),
						this.pemExport(keyPair.publicKey)
					]).then(
						keysPem => {
							const pemPrivate = keysPem[0];
							const pemPublic  = keysPem[1];
							
							// encrypt private key twice (once with login key, once with backup code)
							Promise.all([
								this.aesGcmEncryptBase64(pemPrivate,keyLogin),
								this.aesGcmEncryptBase64WithPhrase(pemPrivate,backupCode)
							]).then(
								res => {
									this.newBackupCode          = backupCodeShow;
									this.newKeyPair             = keyPair;
									this.newKeyPrivateEnc       = res[0];
									this.newKeyPrivateEncBackup = res[1];
									this.running                = false;
								}
							);
						}
					);
				},
				// none of these processes should fail
				this.$root.genericError
			);
		},
		resetAsk:function() {
			this.$store.commit('dialog',{
				captionBody:this.capApp.resetAccessHint,
				image:'refresh.png',
				buttons:[{
					cancel:true,
					caption:this.capGen.button.reset,
					exec:this.reset,
					image:'warning.png'
				},{
					caption:this.capGen.button.cancel,
					keyEscape:true,
					image:'cancel.png'
				}]
			});
		},
		unlockError:function() {
			this.$store.commit('dialog',{
				captionBody:this.capErr.SEC['002'],
				image:'key.png',
				buttons:[{
					cancel:true,
					caption:this.capGen.button.close,
					keyEscape:true,
					image:'cancel.png'
				}]
			});
		},
		unlockWithBackupCode:function() {
			// remove spaces from backup code input
			const backupCode = this.regainBackupCode.replace(/\s/g,'');
			
			// attempt to decrypt private key with backup code
			this.aesGcmDecryptBase64WithPhrase(this.loginPrivateKeyEncBackup,backupCode).then(
				res => this.reencrypt(res),
				()  => this.unlockError()
			);
		},
		unlockWithPassphrase:function() {
			this.pbkdf2PassToAesGcmKey(this.regainPassword,this.loginKeySalt,this.kdfIterations,true).then(
				loginKeyOld => {
					// attempt to decrypt private key with login key based on previous password
					this.aesGcmDecryptBase64(this.loginPrivateKeyEnc,loginKeyOld).then(
						res => this.reencrypt(res),
						()  => this.unlockError()
					);
				},
				this.$root.genericError
			);
		},
		
		// backend calls
		reencrypt:function(privateKeyPem) {
			Promise.all([
				this.pemImport(privateKeyPem,'RSA',false), // import private key PEM
				this.aesGcmImportBase64(this.loginKeyAes)  // import current login key
			]).then(
				res => {
					const privateKey = res[0];
					const loginKey   = res[1];
					
					// encrypt private key with current login key
					this.aesGcmEncryptBase64(privateKeyPem,loginKey).then(
						res => {
							ws.send('loginKeys','storePrivate',{privateKeyEnc:res},true).then(
								res => {
									this.$store.commit('loginEncryption',true);
									this.$store.commit('loginPrivateKey',privateKey);
									this.$store.commit('loginPrivateKeyEnc',res);
								}
							);
						}
					);
				},
				this.$root.genericError
			);
		},
		reset:function() {
			ws.send('loginKeys','reset',{},true).then(
				res => {
					this.$store.commit('loginEncryption',false);
					this.$store.commit('loginPrivateKey',null);
					this.$store.commit('loginPrivateKeyEnc',null);
					this.$store.commit('loginPrivateKeyEncBackup',null);
					this.$store.commit('loginPublicKey',null);
				}
			);
		},
		set:function() {
			this.pemExport(this.newKeyPair.publicKey).then(
				publicKeyPem => {
					ws.send('loginKeys','store',{
						privateKeyEnc:this.newKeyPrivateEnc,
						privateKeyEncBackup:this.newKeyPrivateEncBackup,
						publicKey:publicKeyPem
					},true).then(
						() => {
							this.$store.commit('loginEncryption',true);
							this.$store.commit('loginPrivateKey',this.newKeyPair.privateKey);
							this.$store.commit('loginPrivateKeyEnc',this.newKeyPrivateEnc);
							this.$store.commit('loginPrivateKeyEncBackup',this.newKeyPrivateEncBackup);
							this.$store.commit('loginPublicKey',this.newKeyPair.publicKey);
							this.newBackupCode          = null;
							this.newKeyPair             = null;
							this.newKeyPrivateEnc       = null;
							this.newKeyPrivateEncBackup = null;
						}
					);
				},
				this.$root.genericError
			);
		}
	}
};

let MySettingsAccount = {
	name:'my-settings-account',
	template:`<div>
		<table class="default-inputs">
			<tbody>
				<!-- pw change -->
				<tr>
					<td>{{ capGen.username }}</td>
					<td>	<input disabled="disabled" :value="loginName" /></td>
				</tr>
				<tr>
					<td>{{ capApp.pwOld }}</td>
					<td>	<input v-model="pwOld" @input="newInput = true; generateOldPwKey()" type="password" /></td>
				</tr>
				<tr>
					<td>{{ capApp.pwNew0 }}</td>
					<td>	<input v-model="pwNew0" @input="newInput = true" type="password" /></td>
				</tr>
				<tr>
					<td>{{ capApp.pwNew1 }}</td>
					<td>	<input v-model="pwNew1" @input="newInput = true" type="password" /></td>
				</tr>
			</tbody>
		</table>
		
		<div class="account-action">
			<my-button image="save.png" class="right"
				@trigger="setCheck"
				:active="canSave"
				:caption="capGen.button.save"
			/>
		</div>
		
		<div class="message" v-if="message !== ''">{{ message }}</div>
	</div>`,
	data:function() {
		return {
			// states
			newInput:false,  // new input was entered by user
			pwSettings:null, // server side password settings (require digits, minimum length, etc.)
			
			// inputs
			pwNew0:'',
			pwNew1:'',
			pwOld:'',
			pwOldKey:''
		};
	},
	computed:{
		canSave:(s) => s.pwOldValid
			&& s.pwMatch
			&& s.pwMetDigits
			&& s.pwMetLength
			&& s.pwMetLower
			&& s.pwMetUpper
			&& s.pwMetSpecial,
		message:(s) => {
			if(!s.newInput || s.pwSettings === null)
				return '';
			
			if(!s.pwOldValid)
				return s.capApp.messagePwCurrentWrong;
			
			if(s.pwNew0 === '')
				return '';
			
			if(!s.pwMatch)      return s.capApp.messagePwDiff;
			if(!s.pwMetDigits)  return s.capApp.messagePwRequiresDigit;
			if(!s.pwMetLength)  return s.capApp.messagePwShort;
			if(!s.pwMetLower)   return s.capApp.messagePwRequiresLower;
			if(!s.pwMetUpper)   return s.capApp.messagePwRequiresUpper;
			if(!s.pwMetSpecial) return s.capApp.messagePwRequiresSpecial;
			return '';
		},
		
		// password criteria
		pwMatch:     (s) => s.pwNew0.length !== 0        && s.pwNew0 === s.pwNew1,
		pwMetLength: (s) => s.pwSettings.length          <= s.pwNew0.length,
		pwOldValid:  (s) => s.loginKeyAes                === s.pwOldKey,
		pwMetDigits: (s) => !s.pwSettings.requireDigits  || /\p{Nd}/u.test(s.pwNew0),
		pwMetLower:  (s) => !s.pwSettings.requireLower   || /\p{Ll}/u.test(s.pwNew0),
		pwMetSpecial:(s) => !s.pwSettings.requireSpecial || /[\p{P}\p{M}\p{S}\p{Z}]+/u.test(s.pwNew0),
		pwMetUpper:  (s) => !s.pwSettings.requireUpper   || /\p{Lu}/u.test(s.pwNew0),
		
		// stores
		loginKeyAes:       (s) => s.$store.getters['local/loginKeyAes'],
		loginKeySalt:      (s) => s.$store.getters['local/loginKeySalt'],
		loginEncryption:   (s) => s.$store.getters.loginEncryption,
		loginName:         (s) => s.$store.getters.loginName,
		loginPrivateKey:   (s) => s.$store.getters.loginPrivateKey,
		loginPrivateKeyEnc:(s) => s.$store.getters.loginPrivateKeyEnc,
		kdfIterations:     (s) => s.$store.getters.constants.kdfIterations,
		capApp:            (s) => s.$store.getters.captions.settings.account,
		capGen:            (s) => s.$store.getters.captions.generic
	},
	mounted:function() {
		ws.send('lookup','get',{name:'passwordSettings'},true).then(
			res => this.pwSettings = res.payload,
			this.$root.genericError
		);
	},
	methods:{
		// externals
		aesGcmDecryptBase64,
		aesGcmEncryptBase64,
		aesGcmExportBase64,
		aesGcmImportBase64,
		pbkdf2PassToAesGcmKey,
		
		generateOldPwKey:function() {
			this.pbkdf2PassToAesGcmKey(this.pwOld,this.loginKeySalt,this.kdfIterations,true).then(
				key => {
					this.aesGcmExportBase64(key).then(
						keyBase64 => this.pwOldKey = keyBase64,
						this.$root.genericError
					);
				},
				this.$root.genericError
			);
		},
		
		// actions
		setCheck:function() {
			// encryption not enabled (or private key locked), just save new credentials
			if(!this.loginEncryption || this.loginPrivateKey === null)
				return this.set(null,null);
			
			this.aesGcmImportBase64(this.loginKeyAes).then(
				loginKey => {
					// decrypt private key with current login key
					// generate login key from new password for re-encryption
					Promise.all([
						this.aesGcmDecryptBase64(this.loginPrivateKeyEnc,loginKey),
						this.pbkdf2PassToAesGcmKey(this.pwNew0,this.loginKeySalt,this.kdfIterations,true)
					]).then(
						res => {
							const privateKeyPem = res[0]; // private key PEM to be encrypted
							const newLoginKey   = res[1]; // login key based on new password
							
							// re-encrypt private key with new login key
							this.aesGcmEncryptBase64(privateKeyPem,newLoginKey).then(
								newPrivateKeyEnc => this.set(newPrivateKeyEnc,newLoginKey)
							);
						},
						this.$root.genericError
					);
				},
				this.$root.genericError
			);
		},
		
		// backend calls
		set:function(newPrivateKeyEnc,newLoginKey) {
			let requests = [
				ws.prepare('password','set',{
					pwNew0:this.pwNew0,
					pwNew1:this.pwNew1,
					pwOld:this.pwOld
				})
			];
			
			// update encrypted private key if given
			if(newPrivateKeyEnc !== null)
				requests.push(ws.prepare('loginKeys','storePrivate',{
					privateKeyEnc:newPrivateKeyEnc
				}));
			
			// use same request/transaction to update password & encrypted private key
			// one must not change without the other
			ws.sendMultiple(requests,true).then(
				res => {
					this.pwNew0   = '';
					this.pwNew1   = '';
					this.pwOld    = '';
					this.newInput = false;
					
					if(res.length > 1)
						this.aesGcmExportBase64(newLoginKey).then(keyBase64 => {
							this.$store.commit('loginPrivateKeyEnc',newPrivateKeyEnc);
							this.$store.commit('local/loginKeyAes',keyBase64);
						});
				},
				this.$root.genericError
			);
		}
	}
};

let MySettings = {
	name:'my-settings',
	components:{
		MySettingsAccount,
		MySettingsEncryption
	},
	template:`<div class="settings">
		
		<div class="contentBox grow">
			<div class="top">
				<div class="area">
					<img class="icon" src="images/person.png" />
					<h1>{{ capApp.pageTitle }}</h1>
				</div>
				<div class="area">
					<my-button image="logoff.png"
						@trigger="$emit('logout')"
						:cancel="true"
						:caption="capApp.button.logout"
						:darkBg="true"
					/>
				</div>
			</div>
			<div class="content no-padding">
			
				<!-- display -->
				<div class="contentPart short">
					<div class="contentPartHeader">
						<img class="icon" src="images/visible1.png" />
						<h1>{{ capApp.titleDisplay }}</h1>
					</div>
					<table class="default-inputs">
						<tbody>
							<tr>
								<td>{{ capApp.languageCode }}</td>
								<td>
									<select v-model="settingsInput.languageCode">
										<option
											v-for="l in languageCodes"
											:value="l"
										>{{ l }}</option>
									</select>
								</td>
							</tr>
							<tr>
								<td>{{ capApp.dateFormat }}</td>
								<td>
									<select v-model="settingsInput.dateFormat">
										<option value="Y-m-d">{{ capApp.dateFormat0 }}</option>
										<option value="Y/m/d">{{ capApp.dateFormat1 }}</option>
										<option value="d.m.Y">{{ capApp.dateFormat2 }}</option>
										<option value="d/m/Y">{{ capApp.dateFormat3 }}</option>
										<option value="m/d/Y">{{ capApp.dateFormat4 }}</option>
									</select>
								</td>
							</tr>
							<tr>
								<td>{{ capApp.sundayFirstDow }}</td>
								<td><my-bool v-model="settingsInput.sundayFirstDow" /></td>
							</tr>
							<tr>
								<td>{{ capApp.warnUnsaved }}</td>
								<td><my-bool v-model="settingsInput.warnUnsaved" /></td>
							</tr>
						</tbody>
					</table>
				</div>
				
				<!-- theme -->
				<div class="contentPart short">
					<div class="contentPartHeader">
						<img class="icon" src="images/layout.png" />
						<h1>{{ capApp.titleTheme }}</h1>
					</div>
					<table class="default-inputs">
						<tbody>
							<tr>
								<td>{{ capApp.headerCaptions }}</td>
								<td><my-bool v-model="settingsInput.headerCaptions" /></td>
							</tr>
							<tr>
								<td>{{ capApp.bordersAll }}</td>
								<td><my-bool v-model="settingsInput.bordersAll" /></td>
							</tr>
							<tr>
								<td>{{ capApp.bordersCorners }}</td>
								<td>
									<select v-model="settingsInput.bordersCorner">
										<option value="keep"   >{{ capApp.option.cornerKeep }}</option>
										<option value="rounded">{{ capApp.option.cornerRounded }}</option>
										<option value="squared">{{ capApp.option.cornerSquared }}</option>
									</select>
								</td>
							</tr>
							<tr>
								<td>{{ capApp.fontSize }}</td>
								<td>
									<select v-model="settingsInput.fontSize">
										<option v-for="i in 11"
											:value="70 + (i*5)"
										>{{ (70 + (i*5)) + '%' }}</option>
									</select>
								</td>
							</tr>
							<tr>
								<td>{{ capApp.spacing }}</td>
								<td>
									<select v-model.number="settingsInput.spacing">
										<option :value="1">{{ capGen.option.size0 }}</option>
										<option :value="2">{{ capGen.option.size1 }}</option>
										<option :value="3">{{ capGen.option.size2 }}</option>
										<option :value="4">{{ capGen.option.size3 }}</option>
										<option :value="5">{{ capGen.option.size4 }}</option>
									</select>
								</td>
							</tr>
							<tr>
								<td>{{ capApp.dark }}</td>
								<td><my-bool v-model="settingsInput.dark" /></td>
							</tr>
							<tr>
								<td>{{ capApp.compact }}</td>
								<td><my-bool v-model="settingsInput.compact" /></td>
							</tr>
							<tr v-if="!settingsInput.compact">
								<td>{{ capApp.pageLimit }}</td>
								<td>
									<div class="settings-page-limit">
										<my-button image="remove.png"
											@trigger="settingsInput.pageLimit -= 50"
											:active="settingsInput.pageLimit > 1200"
										/>
										<div>{{ settingsInput.pageLimit + 'px' }}</div>
										<my-button image="add.png"
											@trigger="settingsInput.pageLimit += 50"
										/>
									</div>
								</td>
							</tr>
							<tr>
								<td>{{ capApp.mobileScrollForm }}</td>
								<td><my-bool v-model="settingsInput.mobileScrollForm" /></td>
							</tr>
						</tbody>
					</table>
				</div>
				
				<!-- account -->
				<div class="contentPart short">
					<div class="contentPartHeader">
						<img class="icon" src="images/lock.png" />
						<h1>{{ capApp.titleAccount }}</h1>
					</div>
					<my-settings-account />
				</div>
				
				<!-- encryption -->
				<div class="contentPart short">
					<div class="contentPartHeader">
						<img class="icon" src="images/key.png" />
						<h1>{{ capApp.titleEncryption }}</h1>
					</div>
					<my-settings-encryption
						:moduleEntries="moduleEntries"
					/>
				</div>
			</div>
		</div>
	</div>`,
	props:{
		moduleEntries:{ type:Array, required:true }
	},
	emits:['logout'],
	data:function() {
		return {
			settingsInput:{},
			settingsLoaded:false
		};
	},
	watch:{
		settingsInput:{
			handler:function() {
				if(this.settingsLoaded)
					this.setSetting(this.settingsInput);
			},
			deep:true
		}
	},
	computed:{
		// stores
		languageCodes:function() { return this.$store.getters['schema/languageCodes']; },
		capGen:       function() { return this.$store.getters.captions.generic; },
		capApp:       function() { return this.$store.getters.captions.settings; },
		settings:     function() { return this.$store.getters.settings; }
	},
	mounted:function() {
		this.settingsInput = JSON.parse(JSON.stringify(this.settings));
		this.$store.commit('moduleColor1','');
		this.$store.commit('pageTitle',this.capApp.pageTitle);
		
		this.$nextTick(function() {
			this.settingsLoaded = true;
		});
	},
	methods:{
		// externals
		setSetting
	}
};