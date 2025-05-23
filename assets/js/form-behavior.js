class FormularioHandler {
    constructor() {
        this.phoneInput = document.querySelector("#phone");
        this.emailInput = document.querySelector('input[name="email"]');
        this.form = document.getElementById('contact_form_to_send');
        this.enviarBotao = document.querySelector('.quote_btn .btn[type="button"]');
        this.camposObrigatorios = this.form.querySelectorAll('[required]');
        this.iti = window.intlTelInput(this.phoneInput, {
            initialCountry: "br",
            separateDialCode: true,
            preferredCountries: ['br', 'us', 'gb'],
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.min.js",
        });
        this.mensagens = {
            pt: {
                telefoneInvalido: 'Por favor, insira um número de telefone válido.',
                emailInvalido: 'Por favor, insira um endereço de email válido.',
                erroEnvio: 'Ocorreu um erro ao enviar o formulário.',
                campoObrigatorio: 'Por favor, preencha o campo "{campo}".'
            },
            en: {
                telefoneInvalido: 'Please enter a valid phone number.',
                emailInvalido: 'Please enter a valid email address.',
                erroEnvio: 'An error occurred while submitting the form.',
                campoObrigatorio: 'Please fill out the field "{campo}".'
            }
        };
        this.idioma = window.location.pathname.includes('/en') ? 'en' : 'pt';

        this.adicionarEventListeners();
    }

    adicionarEventListeners() {
        this.phoneInput.addEventListener('keypress', this.inputNumerico);
        this.enviarBotao.addEventListener('click', this.enviarFormulario.bind(this));
        this.phoneInput.addEventListener('input', this.aplicarMascaraTelefone.bind(this));
        this.phoneInput.addEventListener('countrychange', this.aplicarMascaraTelefone.bind(this));
        this.phoneInput.addEventListener('blur', this.aplicarMascaraTelefone.bind(this));
        // Impede apagar caracteres especiais e apaga o número anterior
        this.phoneInput.addEventListener('keydown', this.tratarBackspaceMascara.bind(this));
    }

    tratarBackspaceMascara(e) {
        if (e.key !== 'Backspace') return;
        const pos = this.phoneInput.selectionStart;
        if (pos === 0) return;
        const value = this.phoneInput.value;
        // Se o caractere anterior ao cursor não é número, impede apagar e apaga o número anterior
        if (value[pos - 1] && value[pos - 1].match(/[^0-9]/)) {
            e.preventDefault();
            // Procura o número anterior ao caractere especial
            let i = pos - 2;
            while (i >= 0 && value[i].match(/[^0-9]/)) {
                i--;
            }
            if (i >= 0) {
                // Remove o número anterior
                const nova = value.slice(0, i) + value.slice(i + 1);
                this.phoneInput.value = nova;
                // Reaplica a máscara
                this.aplicarMascaraTelefone();
                // Coloca o cursor na posição do caractere especial
                this.phoneInput.setSelectionRange(pos - 1, pos - 1);
            }
        }
    }

    aplicarMascaraTelefone() {
        const country = this.iti.getSelectedCountryData()?.iso2;
        let value = this.phoneInput.value.replace(/\D/g, '');
        // Se não houver nenhum número, limpa o campo todo
        if (!value.length) {
            this.phoneInput.value = '';
            return;
        }
        let mask = '';
        // Máscaras por país
        switch (country) {
            case 'br': // Brasil
                if (value.length > 10) {
                    mask = '(99) 99999-9999';
                } else {
                    mask = '(99) 9999-9999';
                }
                break;
            case 'us': // USA
            case 'ca': // Canadá (mesmo formato)
                mask = '(999) 999-9999';
                break;
            case 'gb': // UK
                if (value.length > 10) {
                    mask = '99999 999999';
                } else {
                    mask = '9999 999999';
                }
                break;
            case 'pt': // Portugal
                mask = '999 999 999';
                break;
            case 'ar': // Argentina
                mask = '(99) 9999-9999';
                break;
            case 'es': // Espanha
                mask = '999 99 99 99';
                break;
            case 'fr': // França
                mask = '99 99 99 99 99';
                break;
            case 'de': // Alemanha
                mask = '9999 9999999';
                break;
            default:
                mask = '';
        }
        if (mask) {
            let i = 0;
            let newValue = '';
            for (let m of mask) {
                if (m === '9') {
                    if (value[i]) {
                        newValue += value[i++];
                    } else {
                        break;
                    }
                } else {
                    newValue += m;
                }
            }
            this.phoneInput.value = newValue;
        } else {
            this.phoneInput.value = value;
        }
    }

    inputNumerico(event) {
        if (event.which < 48 || event.which > 57) {
            event.preventDefault();
        }
    }

    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    enviarFormulario() {
        // Validação HTML5 nativa
        if (!this.form.checkValidity()) {
            this.form.reportValidity();
            return;
        }
        // Validação customizada de telefone (mantém alerta se telefone inválido)
        if (!this.iti.isValidNumber()) {
            alert(this.mensagens[this.idioma].telefoneInvalido);
            this.phoneInput.focus();
            return;
        }
        // Validação customizada de email (mantém alerta se email inválido)
        if (!this.validarEmail(this.emailInput.value)) {
            alert(this.mensagens[this.idioma].emailInvalido);
            this.emailInput.focus();
            return;
        }
        const formData = new FormData(this.form);
        const countryData = this.iti.getSelectedCountryData();
        const countryCode = countryData ? countryData.dialCode : '';
        const phoneNumber = this.phoneInput.value.replace(/\D/g, '');
        const fullPhoneNumber = '+' + countryCode + phoneNumber;
        formData.set('phone', fullPhoneNumber);
        fetch('https://formspree.io/f/myyleorq', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            const redirectUrl = `${`https://formspree.io`}${data?.next}`;
            window.open(redirectUrl, '_blank');
            this.limparFormulario();
        })
        .catch(error => {
            console.error('Error:', error);
            alert(this.mensagens[this.idioma].erroEnvio);
        });
    }

    limparFormulario() {
        this.camposObrigatorios.forEach(campo => {
            campo.value = '';
        });
        this.emailInput.value = '';
        this.phoneInput.value = '';
        this.iti.destroy();
        this.iti = window.intlTelInput(this.phoneInput, {
            initialCountry: "br",
            separateDialCode: true,
            preferredCountries: ['br', 'us', 'pt'],
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.min.js",
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FormularioHandler();
});